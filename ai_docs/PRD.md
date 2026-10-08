# PRD – Kanban Board

## 1. Ziel und Zielgruppe

Eine schlanke Web-App, die ein Kanban-Board darstellt. Aufgaben werden als Karten auf Spalten verteilt und per Drag & Drop durch den Workflow geschoben. Zielgruppe sind Einzelpersonen, die ihre Aufgaben lokal und ohne Anmeldung organisieren wollen.

## 2. Funktionsumfang

### MVP
- **Board anzeigen:** ein einziges Board mit Standardspalten **Backlog, Doing, Review, Done**.
- **Karten:** erstellen, bearbeiten, löschen.
- **Drag & Drop:** Karten zwischen Spalten und innerhalb einer Spalte verschieben. Die Reihenfolge bleibt gespeichert.
- **Spalten verwalten:** hinzufügen, umbenennen, löschen, Reihenfolge ändern, Farbe wählen.
- **Persistenz:** alle Änderungen werden sofort in SQLite gespeichert.
- **Sprache:** Oberfläche auf Deutsch.

### Nicht-Ziele (nicht Teil des MVP)
- Anmeldung, Benutzerverwaltung, Mehrbenutzerbetrieb
- Mehrere Boards
- Avatare / zugewiesene Personen
- Labels/Tags
- Kommentare, Anhänge, Benachrichtigungen

## 3. Layout (nach Referenzbild `images/1.png`)

- Titel **„Kanban Board"** zentriert, weiß, fett, auf petrolfarbenem Hintergrund (ca. `#00829B`).
- Vier gleich breite Spalten nebeneinander mit abgerundeten Ecken.
- Spaltenheader farbig mit dunkelblauem, fettem Titel:
  - Backlog: rosa (ca. `#F58A9B`)
  - Doing: gelb (ca. `#F5E48A`)
  - Review: grün (ca. `#8AF58F`)
  - Done: hellblau (ca. `#8AE1F5`)
- Spaltenfläche hellgrau (ca. `#F0F1F3`), Karten weiß mit abgerundeten Ecken und dezentem Schatten.
- Karten zeigen Titel, Kurzbeschreibung sowie Fälligkeitsdatum und Priorität als kleine Badges. Der Avatar-Kreis aus dem Bild entfällt im MVP.
- Spalten und Karten haben unterschiedliche Höhen je nach Inhalt, die Spalten reichen bis zum unteren Rand.

## 4. Tech-Stack

| Bereich | Wahl | Begründung |
|---|---|---|
| Frontend | Next.js + TypeScript | Etabliertes React-Framework, typsicher |
| Styling | Tailwind CSS | Schnelles Umsetzen des Layouts |
| Drag & Drop | dnd-kit | Gute Unterstützung für sortierbare Listen über mehrere Container |
| Backend | Python + FastAPI | Wenig Code, Pydantic-Validierung, automatische OpenAPI-Doku |
| Datenbank | SQLite | Keine Installation, ideal für lokalen Single-User-Betrieb |

Das Backend wird vom `kanban-board/`-Ordner aus als `uvicorn backend.main:app` gestartet.

**Code-Ablage:** Der gesamte Code liegt im Ordner `src/` (Unterordner `src/frontend` für das Next.js-Frontend und `src/backend` für das FastAPI-Backend).

## 5. Datenmodell

**Column**
| Feld | Typ | Hinweis |
|---|---|---|
| id | int, PK | |
| title | string | Pflicht |
| color | string | Hex-Wert des Headers |
| position | int | Reihenfolge im Board |

**Card**
| Feld | Typ | Hinweis |
|---|---|---|
| id | int, PK | |
| column_id | int, FK → Column | Löschen der Spalte löscht ihre Karten |
| title | string | Pflicht |
| description | string | optional |
| due_date | date | optional |
| priority | enum | `low`, `medium`, `high`; Standard `medium` |
| position | int | Reihenfolge innerhalb der Spalte |

## 6. API-Übersicht (REST, JSON)

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/board` | Alle Spalten inklusive Karten, sortiert nach `position` |
| POST | `/api/columns` | Spalte anlegen |
| PATCH | `/api/columns/{id}` | Titel, Farbe oder Position ändern |
| DELETE | `/api/columns/{id}` | Spalte samt Karten löschen |
| POST | `/api/cards` | Karte anlegen |
| PATCH | `/api/cards/{id}` | Karte bearbeiten |
| DELETE | `/api/cards/{id}` | Karte löschen |
| POST | `/api/cards/{id}/move` | Karte verschieben (`column_id`, `position`) |

Beim ersten Start legt das Backend die vier Standardspalten an.

## 7. Meilensteine

1. **Grundgerüst:** Next.js- und FastAPI-Projekt, SQLite-Anbindung, Standardspalten
2. **API:** Endpunkte für Spalten und Karten inklusive Verschieben
3. **Board-UI:** Darstellung nach Referenzbild, Dialoge zum Erstellen und Bearbeiten
4. **Drag & Drop:** Karten verschieben und Reihenfolge speichern, Spalten sortieren
5. **Politur:** Fehlerbehandlung, Leerzustände, responsives Verhalten

## 8. Offene Punkte

- Soll das Board später mehrere Boards oder Benutzer unterstützen? - ja, aber erst später.
- Sollen erledigte Karten automatisch archiviert werden? - nein
