"""Async compatibility layer for the maintained `libsql` driver.

The repository previously depended on the deprecated `libsql-client` package.
This module exposes the small async API surface the app uses while relying on
the maintained `libsql` package underneath.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import libsql


@dataclass
class ResultSet:
    rows: list[tuple[Any, ...]]


class Client:
    def __init__(self, url: str, auth_token: str | None = None) -> None:
        self._conn = libsql.connect(
            database=url,
            auth_token=auth_token or "",
            _check_same_thread=False,
        )

    async def execute(
        self,
        statement: str,
        args: list[Any] | tuple[Any, ...] | None = None,
    ) -> ResultSet:
        params = list(args) if args is not None else []

        def _run() -> ResultSet:
            cursor = self._conn.execute(statement, params)
            try:
                rows = cursor.fetchall()
            except Exception:
                rows = []
            return ResultSet(rows=rows)

        return await asyncio.to_thread(_run)

    async def close(self) -> None:
        await asyncio.to_thread(self._conn.close)


def create_client(*, url: str, auth_token: str | None = None, **_: Any) -> Client:
    return Client(url=url, auth_token=auth_token)
