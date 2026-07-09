"""Async compatibility layer for the maintained `libsql` driver.

The repository previously depended on the deprecated `libsql-client` package.
This module exposes the small async API surface the app uses while relying on
the maintained `libsql` package underneath.
"""

from __future__ import annotations

import asyncio
import sqlite3
from dataclasses import dataclass
from typing import Any

import libsql

from utils.libsql_params import inline_null_params


@dataclass
class ResultSet:
    rows: list[tuple[Any, ...]]


class Client:
    def __init__(self, url: str, auth_token: str | None = None) -> None:
        self._url = url
        self._auth_token = auth_token or ""
        self._conn: Any | None = None
        self._lock: asyncio.Lock | None = None

    def _connect(self) -> Any:
        if self._use_local_sqlite:
            return sqlite3.connect(
                self._url,
                uri=self._url.startswith("file:"),
                check_same_thread=False,
            )
        return libsql.connect(
            database=self._url,
            auth_token=self._auth_token,
            _check_same_thread=False,
        )

    def _ensure_connection(self) -> Any:
        if self._conn is None:
            self._conn = self._connect()
        return self._conn

    def _ensure_lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    @property
    def _use_local_sqlite(self) -> bool:
        return (
            self._url == ":memory:"
            or self._url.startswith("file:")
            or self._url.endswith(".db")
            or self._url.endswith(".sqlite")
            or self._url.endswith(".sqlite3")
        )

    @staticmethod
    def _should_reconnect(exc: Exception) -> bool:
        message = str(exc).lower()
        return (
            "stream not found" in message
            or "hrana" in message
            or "websocket" in message
            or "connection" in message
            or "transport" in message
        )

    def _reconnect(self) -> None:
        try:
            if self._conn is not None:
                self._conn.close()
        except Exception:
            pass
        self._conn = None
        self._conn = self._connect()

    async def execute(
        self,
        statement: str,
        args: list[Any] | tuple[Any, ...] | None = None,
    ) -> ResultSet:
        statement, params = inline_null_params(
            statement,
            list(args) if args is not None else [],
        )

        def _run(sql: str, sql_params: list[Any]) -> ResultSet:
            conn = self._ensure_connection()
            cursor = conn.execute(sql, sql_params)
            try:
                conn.commit()
            except Exception:
                pass
            try:
                rows = cursor.fetchall()
            except Exception:
                rows = []
            return ResultSet(rows=rows)

        async with self._ensure_lock():
            for attempt in range(2):
                try:
                    return await asyncio.to_thread(_run, statement, params)
                except Exception as exc:
                    if attempt == 0 and self._should_reconnect(exc):
                        await asyncio.to_thread(self._reconnect)
                        continue
                    if _should_retry_with_inline_nulls(exc, params):
                        retry_statement, retry_params = inline_null_params(statement, params)
                        return await asyncio.to_thread(_run, retry_statement, retry_params)
                    raise

    async def close(self) -> None:
        async with self._ensure_lock():
            conn = self._conn
            self._conn = None
            if conn is not None:
                await asyncio.to_thread(conn.close)


def create_client(*, url: str, auth_token: str | None = None, **_: Any) -> Client:
    return Client(url=url, auth_token=auth_token)


def _should_retry_with_inline_nulls(exc: Exception, params: list[Any]) -> bool:
    if not any(param is None for param in params):
        return False
    message = str(exc)
    return ("None" in message and "could not be parsed" in message) or (
        "SQL_PARSE_ERROR" in message and '"None"' in message
    )
