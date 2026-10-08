"use client";

import { useCallback, useEffect, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { api, type CardData, type ColumnData } from "../lib/api";
import CardDialog, { type CardFormValues } from "./CardDialog";
import { CardView } from "./CardItem";
import Column from "./Column";
import ColumnDialog from "./ColumnDialog";

type DialogState =
  | { kind: "newCard"; columnId: number }
  | { kind: "editCard"; card: CardData }
  | { kind: "newColumn" }
  | { kind: "editColumn"; column: ColumnData }
  | null;

const colId = (id: number) => `col-${id}`;
const cardId = (id: number) => `card-${id}`;
const parseId = (id: string | number) => Number(String(id).split("-")[1]);
const isCol = (id: string | number) => String(id).startsWith("col-");

export default function Board() {
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    try {
      setColumns(await api.getBoard());
      setError(null);
    } catch {
      setError("Das Board konnte nicht geladen werden. Läuft das Backend auf Port 8000?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Führt eine API-Aktion aus und lädt bei Fehlern den Serverstand neu. */
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch {
      setError("Die Änderung konnte nicht gespeichert werden.");
    }
    await load();
  };

  const findColumnOfCard = (cols: ColumnData[], id: string | number) =>
    cols.find((c) => c.cards.some((card) => cardId(card.id) === id));

  // Spalten nur gegen Spalten, Karten gegen alles (Karten und Spalten als Ablageziel).
  const collision: CollisionDetection = (args) => {
    if (isCol(args.active.id)) {
      return closestCorners({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => isCol(c.id)),
      });
    }
    return closestCorners(args);
  };

  const onDragStart = (e: DragStartEvent) => {
    if (isCol(e.active.id)) return;
    const card = columns.flatMap((c) => c.cards).find((c) => cardId(c.id) === e.active.id);
    setActiveCard(card ?? null);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || isCol(active.id)) return;
    setColumns((cols) => {
      const from = findColumnOfCard(cols, active.id);
      const to = isCol(over.id)
        ? cols.find((c) => colId(c.id) === over.id)
        : findColumnOfCard(cols, over.id);
      if (!from || !to || from.id === to.id) return cols;

      const moving = from.cards.find((c) => cardId(c.id) === active.id)!;
      const overIndex = to.cards.findIndex((c) => cardId(c.id) === over.id);
      let index = to.cards.length;
      if (overIndex >= 0) {
        const activeRect = active.rect.current.translated;
        const below = activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
        index = overIndex + (below ? 1 : 0);
      }
      return cols.map((c) => {
        if (c.id === from.id) return { ...c, cards: c.cards.filter((x) => x.id !== moving.id) };
        if (c.id === to.id) {
          const cards = [...c.cards];
          cards.splice(index, 0, { ...moving, column_id: to.id });
          return { ...c, cards };
        }
        return c;
      });
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCard(null);
    if (!over) return load(); // abgebrochen: Serverstand wiederherstellen

    if (isCol(active.id)) {
      const from = columns.findIndex((c) => colId(c.id) === active.id);
      const to = columns.findIndex((c) => colId(c.id) === over.id);
      if (from < 0 || to < 0 || from === to) return;
      setColumns(arrayMove(columns, from, to));
      return run(() => api.updateColumn(parseId(active.id), { position: to }));
    }

    const col = findColumnOfCard(columns, active.id);
    if (!col) return load();
    let cards = col.cards;
    const from = cards.findIndex((c) => cardId(c.id) === active.id);
    const overIndex = cards.findIndex((c) => cardId(c.id) === over.id);
    if (overIndex >= 0 && overIndex !== from) {
      cards = arrayMove(cards, from, overIndex);
      setColumns(columns.map((c) => (c.id === col.id ? { ...c, cards } : c)));
    }
    const position = cards.findIndex((c) => cardId(c.id) === active.id);
    return run(() => api.moveCard(parseId(active.id), col.id, position));
  };

  const saveCard = (values: CardFormValues) => {
    const d = dialog;
    setDialog(null);
    if (d?.kind === "newCard") run(() => api.createCard({ column_id: d.columnId, ...values }));
    if (d?.kind === "editCard") run(() => api.updateCard(d.card.id, values));
  };

  const deleteCard = () => {
    if (dialog?.kind !== "editCard") return;
    if (!confirm(`Karte „${dialog.card.title}“ wirklich löschen?`)) return;
    const id = dialog.card.id;
    setDialog(null);
    run(() => api.deleteCard(id));
  };

  const saveColumn = (values: { title: string; color: string }) => {
    const d = dialog;
    setDialog(null);
    if (d?.kind === "newColumn") run(() => api.createColumn(values));
    if (d?.kind === "editColumn") run(() => api.updateColumn(d.column.id, values));
  };

  const deleteColumn = () => {
    if (dialog?.kind !== "editColumn") return;
    const { id, title, cards } = dialog.column;
    const hint = cards.length ? ` Die ${cards.length} enthaltenen Karten werden ebenfalls gelöscht.` : "";
    if (!confirm(`Spalte „${title}“ wirklich löschen?${hint}`)) return;
    setDialog(null);
    run(() => api.deleteColumn(id));
  };

  return (
    <main className="flex min-h-screen flex-col px-4 pb-6 pt-4 sm:px-8">
      <h1 className="mb-6 text-center text-4xl font-bold text-white">Kanban Board</h1>

      {error && (
        <div
          role="alert"
          className="mx-auto mb-4 flex max-w-xl items-center gap-3 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800"
        >
          <span className="flex-1">{error}</span>
          <button className="font-semibold underline" onClick={load}>
            Erneut versuchen
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-white/80">Lade Board …</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collision}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setActiveCard(null);
            load();
          }}
        >
          <SortableContext items={columns.map((c) => colId(c.id))} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-1 items-stretch gap-6 overflow-x-auto pb-2">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onAddCard={() => setDialog({ kind: "newCard", columnId: column.id })}
                  onEditCard={(card) => setDialog({ kind: "editCard", card })}
                  onEditColumn={() => setDialog({ kind: "editColumn", column })}
                />
              ))}
              <button
                type="button"
                onClick={() => setDialog({ kind: "newColumn" })}
                className="min-w-[160px] self-start rounded-xl border-2 border-dashed border-white/50 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                + Spalte hinzufügen
              </button>
            </div>
          </SortableContext>
          <DragOverlay>{activeCard && <CardView card={activeCard} dragging />}</DragOverlay>
        </DndContext>
      )}

      {(dialog?.kind === "newCard" || dialog?.kind === "editCard") && (
        <CardDialog
          card={dialog.kind === "editCard" ? dialog.card : undefined}
          onSave={saveCard}
          onDelete={dialog.kind === "editCard" ? deleteCard : undefined}
          onClose={() => setDialog(null)}
        />
      )}
      {(dialog?.kind === "newColumn" || dialog?.kind === "editColumn") && (
        <ColumnDialog
          column={dialog.kind === "editColumn" ? dialog.column : undefined}
          onSave={saveColumn}
          onDelete={dialog.kind === "editColumn" ? deleteColumn : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
