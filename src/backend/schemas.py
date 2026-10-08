from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field

Priority = Literal["low", "medium", "high"]
HEX = r"^#[0-9A-Fa-f]{6}$"


class ColumnCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    color: str = Field(pattern=HEX)


class ColumnUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=100)
    color: Optional[str] = Field(default=None, pattern=HEX)
    position: Optional[int] = Field(default=None, ge=0)


class CardCreate(BaseModel):
    column_id: int
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    due_date: Optional[date] = None
    priority: Priority = "medium"


class CardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[Priority] = None


class CardMove(BaseModel):
    column_id: int
    position: int = Field(ge=0)


class CardOut(BaseModel):
    id: int
    column_id: int
    title: str
    description: str
    due_date: Optional[date]
    priority: Priority
    position: int


class ColumnOut(BaseModel):
    id: int
    title: str
    color: str
    position: int
    cards: list[CardOut] = []
