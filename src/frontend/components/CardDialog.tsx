"use client";

import { useState } from "react";
import type { CardData, Priority } from "../lib/api";
import Modal, { dangerBtn, inputCls, labelCls, primaryBtn, secondaryBtn } from "./Modal";

export interface CardFormValues {
  title: string;
  description: string;
  due_date: string | null;
  priority: Priority;
}

export default function CardDialog({
  card,
  onSave,
  onDelete,
  onClose,
}: {
  card?: CardData;
  onSave: (v: CardFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState(card?.due_date ?? "");
  const [priority, setPriority] = useState<Priority>(card?.priority ?? "medium");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, due_date: dueDate || null, priority });
  };

  return (
    <Modal title={card ? "Karte bearbeiten" : "Neue Karte"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Titel *</label>
          <input
            autoFocus
            className={inputCls}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Beschreibung</label>
          <textarea
            className={inputCls}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Fälligkeitsdatum</label>
            <input
              type="date"
              className={inputCls}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Priorität</label>
            <select
              className={inputCls}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            {onDelete && (
              <button type="button" className={dangerBtn} onClick={onDelete}>
                Löschen
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className={secondaryBtn} onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className={primaryBtn} disabled={!title.trim()}>
              Speichern
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
