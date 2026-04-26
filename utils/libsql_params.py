"""Parameter binding helpers for libSQL compatibility wrappers."""

from __future__ import annotations

from typing import Any, Iterable


def inline_null_params(statement: str, params: Iterable[Any]) -> tuple[str, list[Any]]:
    """Replace placeholders for Python None values with SQL NULL.

    The maintained libsql driver normally binds None correctly. Some remote
    Hrana parse failures have surfaced with Python ``None`` rendered as a SQL
    token, so the wrappers use this only as a retry fallback.
    """
    values = list(params)
    if not values or all(value is not None for value in values):
        return statement, values

    output: list[str] = []
    remaining: list[Any] = []
    param_index = 0
    in_single = False
    in_double = False
    index = 0

    while index < len(statement):
        char = statement[index]
        output.append(char)

        if char == "'" and not in_double:
            if in_single and index + 1 < len(statement) and statement[index + 1] == "'":
                index += 1
                output.append(statement[index])
            else:
                in_single = not in_single
        elif char == '"' and not in_single:
            if in_double and index + 1 < len(statement) and statement[index + 1] == '"':
                index += 1
                output.append(statement[index])
            else:
                in_double = not in_double
        elif char == "?" and not in_single and not in_double:
            if param_index < len(values):
                value = values[param_index]
                param_index += 1
                if value is None:
                    output[-1] = "NULL"
                else:
                    remaining.append(value)

        index += 1

    if param_index != len(values):
        return statement, values
    return "".join(output), remaining
