"""Synchronous compatibility helpers for the maintained ``libsql`` driver.

The status/domain services were originally written against ``sqlite3`` and
expect a cursor/row API with ``fetchone()``, ``fetchall()`` and key-based row
access. This module provides a minimal adapter over ``libsql`` so the existing
domain logic can persist directly to Turso without a full service rewrite.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

import libsql


@dataclass
class Row:
    """Small sqlite.Row-like wrapper with index and key access."""

    _columns: tuple[str, ...]
    _values: tuple[Any, ...]

    def __getitem__(self, key: int | str) -> Any:
        if isinstance(key, int):
            return self._values[key]
        try:
            idx = self._columns.index(key)
        except ValueError as exc:
            raise KeyError(key) from exc
        return self._values[idx]

    def keys(self) -> tuple[str, ...]:
        return self._columns

    def __iter__(self):
        return iter(self._values)

    def __len__(self) -> int:
        return len(self._values)


class Cursor:
    """Cursor wrapper exposing sqlite-like fetch helpers."""

    def __init__(self, cursor: Any) -> None:
        self._cursor = cursor
        self.description = getattr(cursor, "description", ()) or ()

    @property
    def _columns(self) -> tuple[str, ...]:
        return tuple(col[0] for col in self.description)

    def _wrap(self, values: tuple[Any, ...] | list[Any] | None) -> Row | None:
        if values is None:
            return None
        return Row(self._columns, tuple(values))

    def fetchone(self) -> Row | None:
        try:
            values = self._cursor.fetchone()
        except Exception:
            values = None
        return self._wrap(values)

    def fetchall(self) -> list[Row]:
        try:
            rows = self._cursor.fetchall()
        except Exception:
            rows = []
        return [Row(self._columns, tuple(row)) for row in rows]


class Connection:
    """Tiny sqlite.Connection-like adapter over libsql."""

    def __init__(self, database: str, auth_token: str | None = None) -> None:
        self._conn = libsql.connect(
            database=database,
            auth_token=auth_token or "",
            _check_same_thread=False,
        )
        self.row_factory = None

    def execute(
        self,
        statement: str,
        params: Iterable[Any] | None = None,
    ) -> Cursor:
        cursor = self._conn.execute(statement, list(params or []))
        return Cursor(cursor)

    def executescript(self, script: str) -> None:
        for statement in _split_statements(script):
            self._conn.execute(statement)

    def commit(self) -> None:
        # libsql autocommits each statement; keep sqlite-compatible API surface.
        return None

    def close(self) -> None:
        self._conn.close()


def create_connection(*, url: str, auth_token: str | None = None) -> Connection:
    return Connection(database=url, auth_token=auth_token)


def _split_statements(script: str) -> list[str]:
    """Split a SQL script on semicolons while preserving quoted strings."""

    statements: list[str] = []
    current: list[str] = []
    in_single = False
    in_double = False
    escape = False

    for char in script:
        current.append(char)
        if escape:
            escape = False
            continue
        if char == "\\":
            escape = True
            continue
        if char == "'" and not in_double:
            in_single = not in_single
            continue
        if char == '"' and not in_single:
            in_double = not in_double
            continue
        if char == ";" and not in_single and not in_double:
            statement = "".join(current[:-1]).strip()
            current.clear()
            if statement:
                statements.append(statement)

    trailing = "".join(current).strip()
    if trailing:
        statements.append(trailing)
    return statements
