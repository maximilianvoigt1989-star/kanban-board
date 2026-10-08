"use client";

import { useState } from "react";
import type { ColumnData } from "../lib/api";
import Modal, { dangerBtn, inputCls, labelCls, primaryBtn, secondaryBtn } from "./Modal";

const PRESETS = ["#F58A9B", "#F5E48A", "#8AF58F", "#8AE1F5", "#C9A8F5", "#F5B98A"];

export default function ColumnDialog({
  column,
  onSave,
  onDelete,
  onClose,
}: {
  column?: ColumnData;
  onSave: (v: { title: string; color: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(column?.title ?? "");
  const [color, setColor] = useState(column?.color ?? PRESETS[4]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) onSave({ title: title.trim(), color });
  };

  return (
    <Modal title={column ? "Spalte bearbeiten" : "Neue Spalte"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Titel *</label>
          <input
            autoFocus
            className={inputCls}
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Farbe</label>
          <div className="flex items-center gap-2">
            {PRESETS.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={`Farbe ${c}`}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 ${
                  color.toLowerCase() === c.toLowerCase() ? "border-navy" : "border-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              className="h-7 w-9 cursor-pointer rounded border border-gray-300"
              aria-label="Eigene Farbe"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            {onDelete && (
              <button type="button" className={dangerBtn} onClick={onDelete}>
                Spalte löschen
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
