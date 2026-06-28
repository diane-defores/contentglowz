from utils.libsql_params import inline_null_params
from utils.libsql_sync import Connection


def test_inline_null_params_rewrites_only_none_placeholders():
    sql, params = inline_null_params(
        "INSERT INTO api_cost_log (timestamp, project_id, job_id) VALUES (?, ?, ?)",
        ["2026-04-26T12:26:00", None, "job-1"],
    )

    assert sql == (
        "INSERT INTO api_cost_log (timestamp, project_id, job_id) "
        "VALUES (?, NULL, ?)"
    )
    assert params == ["2026-04-26T12:26:00", "job-1"]


def test_inline_null_params_ignores_question_marks_inside_strings():
    sql, params = inline_null_params(
        "UPDATE jobs SET message = '?', data = ? WHERE job_id = ?",
        [None, "job-1"],
    )

    assert sql == "UPDATE jobs SET message = '?', data = NULL WHERE job_id = ?"
    assert params == ["job-1"]


def test_sync_connection_inlines_null_params_before_driver_call(monkeypatch):
    calls = []

    class FakeRawConnection:
        def execute(self, statement, params=None):
            calls.append((statement, params))
            return FakeCursor()

    class FakeCursor:
        description = ()

        def fetchall(self):
            return []

    monkeypatch.setattr("utils.libsql_sync.libsql.connect", lambda **_kwargs: FakeRawConnection())

    conn = Connection(database="libsql://example")
    conn.execute("INSERT INTO t (a, b, c) VALUES (?, ?, ?)", ["a", None, "c"])

    assert calls == [
        ("INSERT INTO t (a, b, c) VALUES (?, NULL, ?)", ["a", "c"]),
    ]
