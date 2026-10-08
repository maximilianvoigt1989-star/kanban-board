"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardData, ColumnData } from "../lib/api";
import CardItem from "./CardItem";

export default function Column({
  column,
  onAddCard,
  onEditCard,
  onEditColumn,
}: {
  column: ColumnData;
  onAddCard: () => void;
  onEditCard: (card: CardData) => void;
  onEditColumn: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${column.id}`,
    data: { type: "column" },
  });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex min-w-[260px] flex-1 flex-col overflow-hidden rounded-xl shadow-md ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <header
        className="flex cursor-grab touch-none items-center justify-between px-3 py-3"
        style={{ background: column.color }}
        {...attributes}
        {...listeners}
      >
        <h2 className="flex-1 truncate text-center text-lg font-bold text-navy">
          {column.title}
          <span className="ml-2 text-sm font-semibold opacity-60">{column.cards.length}</span>
        </h2>
        <button
          type="button"
          aria-label="Spalte bearbeiten"
          title="Spalte bearbeiten"
          className="rounded px-1.5 text-navy/70 hover:bg-black/10 hover:text-navy"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onEditColumn}
        >
          ⚙
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-3 bg-surface p-3">
        <SortableContext
          items={column.cards.map((c) => `card-${c.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <CardItem key={card.id} card={card} onClick={() => onEditCard(card)} />
          ))}
        </SortableContext>

        {column.cards.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-gray-300 py-6 text-center text-xs text-gray-400">
            Keine Karten – hierher ziehen
          </p>
        )}

        <button
          type="button"
          onClick={onAddCard}
          className="mt-auto rounded-lg py-2 text-sm font-semibold text-gray-500 hover:bg-black/5 hover:text-navy"
        >
          + Karte hinzufügen
        </button>
      </div>
    </section>
  );
}
