export type Priority = "low" | "medium" | "high";

export interface CardData {
  id: number;
  column_id: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: Priority;
  position: number;
}

export interface ColumnData {
  id: number;
  title: string;
  color: string;
  position: number;
  cards: CardData[];
}

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Anfrage fehlgeschlagen (${res.status})`);
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  getBoard: () => request<ColumnData[]>("/board"),
  createColumn: (d: { title: string; color: string }) => request<ColumnData>("/columns", "POST", d),
  updateColumn: (id: number, d: Partial<{ title: string; color: string; position: number }>) =>
    request<ColumnData>(`/columns/${id}`, "PATCH", d),
  deleteColumn: (id: number) => request<void>(`/columns/${id}`, "DELETE"),
  createCard: (d: {
    column_id: number;
    title: string;
    description: string;
    due_date: string | null;
    priority: Priority;
  }) => request<CardData>("/cards", "POST", d),
  updateCard: (
    id: number,
    d: Partial<Pick<CardData, "title" | "description" | "due_date" | "priority">>,
  ) => request<CardData>(`/cards/${id}`, "PATCH", d),
  deleteCard: (id: number) => request<void>(`/cards/${id}`, "DELETE"),
  moveCard: (id: number, column_id: number, position: number) =>
    request<CardData>(`/cards/${id}/move`, "POST", { column_id, position }),
};
