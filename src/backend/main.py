from contextlib import asynccontextmanager
from sqlite3 import Connection

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from .database import get_conn, init_db
from .schemas import (
    CardCreate, CardMove, CardOut, CardUpdate,
    ColumnCreate, ColumnOut, ColumnUpdate,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Kanban Board", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _column_ids(conn: Connection) -> list[int]:
    return [r["id"] for r in conn.execute("SELECT id FROM columns ORDER BY position, id")]


def _card_ids(conn: Connection, column_id: int) -> list[int]:
    return [
        r["id"]
        for r in conn.execute(
            "SELECT id FROM cards WHERE column_id = ? ORDER BY position, id", (column_id,)
        )
    ]


def _require_column(conn: Connection, column_id: int) -> None:
    if not conn.execute("SELECT 1 FROM columns WHERE id = ?", (column_id,)).fetchone():
        raise HTTPException(404, "Spalte nicht gefunden")


def _get_card(conn: Connection, card_id: int) -> CardOut:
    row = conn.execute("SELECT * FROM cards WHERE id = ?", (card_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Karte nicht gefunden")
    return CardOut(**row)


def _get_column(conn: Connection, column_id: int) -> ColumnOut:
    row = conn.execute("SELECT * FROM columns WHERE id = ?", (column_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Spalte nicht gefunden")
    return ColumnOut(**row)


def _renumber_columns(conn: Connection, ids: list[int]) -> None:
    conn.executemany(
        "UPDATE columns SET position = ? WHERE id = ?", [(i, c) for i, c in enumerate(ids)]
    )


def _renumber_cards(conn: Connection, column_id: int, ids: list[int]) -> None:
    conn.executemany(
        "UPDATE cards SET position = ?, column_id = ? WHERE id = ?",
        [(i, column_id, c) for i, c in enumerate(ids)],
    )


@app.get("/api/board", response_model=list[ColumnOut])
def get_board():
    with get_conn() as conn:
        columns = [
            ColumnOut(**r) for r in conn.execute("SELECT * FROM columns ORDER BY position, id")
        ]
        by_id = {c.id: c for c in columns}
        for r in conn.execute("SELECT * FROM cards ORDER BY position, id"):
            by_id[r["column_id"]].cards.append(CardOut(**r))
        return columns


@app.post("/api/columns", response_model=ColumnOut, status_code=201)
def create_column(data: ColumnCreate):
    with get_conn() as conn:
        pos = len(_column_ids(conn))
        cur = conn.execute(
            "INSERT INTO columns (title, color, position) VALUES (?, ?, ?)",
            (data.title.strip(), data.color, pos),
        )
        return _get_column(conn, cur.lastrowid)


@app.patch("/api/columns/{column_id}", response_model=ColumnOut)
def update_column(column_id: int, data: ColumnUpdate):
    with get_conn() as conn:
        _require_column(conn, column_id)
        if data.title is not None:
            conn.execute(
                "UPDATE columns SET title = ? WHERE id = ?", (data.title.strip(), column_id)
            )
        if data.color is not None:
            conn.execute("UPDATE columns SET color = ? WHERE id = ?", (data.color, column_id))
        if data.position is not None:
            ids = [i for i in _column_ids(conn) if i != column_id]
            ids.insert(min(data.position, len(ids)), column_id)
            _renumber_columns(conn, ids)
        return _get_column(conn, column_id)


@app.delete("/api/columns/{column_id}", status_code=204)
def delete_column(column_id: int):
    with get_conn() as conn:
        _require_column(conn, column_id)
        conn.execute("DELETE FROM columns WHERE id = ?", (column_id,))
        _renumber_columns(conn, _column_ids(conn))
    return Response(status_code=204)


@app.post("/api/cards", response_model=CardOut, status_code=201)
def create_card(data: CardCreate):
    with get_conn() as conn:
        _require_column(conn, data.column_id)
        pos = len(_card_ids(conn, data.column_id))
        cur = conn.execute(
            "INSERT INTO cards (column_id, title, description, due_date, priority, position)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            (
                data.column_id,
                data.title.strip(),
                data.description,
                data.due_date.isoformat() if data.due_date else None,
                data.priority,
                pos,
            ),
        )
        return _get_card(conn, cur.lastrowid)


@app.patch("/api/cards/{card_id}", response_model=CardOut)
def update_card(card_id: int, data: CardUpdate):
    with get_conn() as conn:
        _get_card(conn, card_id)
        # Nur explizit gesendete Felder; due_date = null löscht das Datum.
        fields = data.model_dump(exclude_unset=True)
        for key in ("title", "description", "priority"):
            if key in fields and fields[key] is None:
                del fields[key]
        if "title" in fields:
            fields["title"] = fields["title"].strip()
        if fields.get("due_date"):
            fields["due_date"] = fields["due_date"].isoformat()
        if fields:
            sets = ", ".join(f"{k} = ?" for k in fields)
            conn.execute(f"UPDATE cards SET {sets} WHERE id = ?", (*fields.values(), card_id))
        return _get_card(conn, card_id)


@app.delete("/api/cards/{card_id}", status_code=204)
def delete_card(card_id: int):
    with get_conn() as conn:
        card = _get_card(conn, card_id)
        conn.execute("DELETE FROM cards WHERE id = ?", (card_id,))
        _renumber_cards(conn, card.column_id, _card_ids(conn, card.column_id))
    return Response(status_code=204)


@app.post("/api/cards/{card_id}/move", response_model=CardOut)
def move_card(card_id: int, data: CardMove):
    with get_conn() as conn:
        card = _get_card(conn, card_id)
        _require_column(conn, data.column_id)
        source = [i for i in _card_ids(conn, card.column_id) if i != card_id]
        if data.column_id == card.column_id:
            target = source
        else:
            _renumber_cards(conn, card.column_id, source)
            target = _card_ids(conn, data.column_id)
        target.insert(min(data.position, len(target)), card_id)
        _renumber_cards(conn, data.column_id, target)
        return _get_card(conn, card_id)
