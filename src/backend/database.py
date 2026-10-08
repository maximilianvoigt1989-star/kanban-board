import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "kanban.db"

DEFAULT_COLUMNS = [
    ("Backlog", "#F58A9B"),
    ("Doing", "#F5E48A"),
    ("Review", "#8AF58F"),
    ("Done", "#8AE1F5"),
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    color TEXT NOT NULL,
    position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    position INTEGER NOT NULL
);
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        if conn.execute("SELECT COUNT(*) FROM columns").fetchone()[0] == 0:
            conn.executemany(
                "INSERT INTO columns (title, color, position) VALUES (?, ?, ?)",
                [(t, c, i) for i, (t, c) in enumerate(DEFAULT_COLUMNS)],
            )
