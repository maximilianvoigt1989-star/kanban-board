"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardData, Priority } from "../lib/api";

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  low: { label: "Niedrig", cls: "bg-green-100 text-green-800" },
  medium: { label: "Mittel", cls: "bg-amber-100 text-amber-800" },
  high: { label: "Hoch", cls: "bg-red-100 text-red-800" },
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function isOverdue(iso: string) {
  return iso < new Date().toLocaleDateString("sv-SE");
}

export function CardView({ card, dragging }: { card: CardData; dragging?: boolean }) {
  const prio = PRIORITY[card.priority];
  return (
    <div
      className={`rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 ${
        dragging ? "rotate-2 shadow-lg" : ""
      }`}
    >
      <p className="break-words text-sm font-bold text-navy">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-xs text-gray-600">
          {card.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.due_date && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isOverdue(card.due_date) ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
            }`}
          >
            📅 {formatDate(card.due_date)}
          </span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${prio.cls}`}>
          {prio.label}
        </span>
      </div>
    </div>
  );
}

export default function CardItem({ card, onClick }: { card: CardData; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`cursor-grab touch-none ${isDragging ? "opacity-40" : ""}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <CardView card={card} />
    </div>
  );
}
