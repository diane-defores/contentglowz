from api import observability


class FakeSentrySdk:
    def __init__(self):
        self.init_kwargs = None
        self.captured = []

    def init(self, **kwargs):
        self.init_kwargs = kwargs

    def capture_exception(self, exc):
        self.captured.append(exc)
        return "event-id"


def test_init_sentry_disabled_without_dsn(monkeypatch):
    fake = FakeSentrySdk()
    monkeypatch.setattr(observability, "_INITIALIZED", False)
    monkeypatch.setattr(observability, "_sentry_sdk", fake)
    monkeypatch.delenv("SENTRY_DSN", raising=False)

    assert observability.init_sentry() is False
    assert fake.init_kwargs is None


def test_init_sentry_uses_lab_defaults(monkeypatch):
    fake = FakeSentrySdk()
    monkeypatch.setattr(observability, "_INITIALIZED", False)
    monkeypatch.setattr(observability, "_sentry_sdk", fake)
    monkeypatch.setenv("SENTRY_DSN", "https://public@example.ingest.sentry.io/1")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("BACKEND_GIT_SHA", "abc123")
    monkeypatch.delenv("SENTRY_TRACES_SAMPLE_RATE", raising=False)
    monkeypatch.delenv("SENTRY_SEND_DEFAULT_PII", raising=False)

    assert observability.init_sentry() is True

    assert fake.init_kwargs == {
        "dsn": "https://public@example.ingest.sentry.io/1",
        "sample_rate": 1.0,
        "traces_sample_rate": 0.0,
        "send_default_pii": True,
        "debug": False,
        "environment": "production",
        "release": "abc123",
    }


def test_capture_exception_is_noop_before_init(monkeypatch):
    fake = FakeSentrySdk()
    monkeypatch.setattr(observability, "_INITIALIZED", False)
    monkeypatch.setattr(observability, "_sentry_sdk", fake)

    assert observability.capture_exception(RuntimeError("boom")) is None
    assert fake.captured == []


def test_capture_exception_uses_sentry_when_initialized(monkeypatch):
    fake = FakeSentrySdk()
    exc = RuntimeError("boom")
    monkeypatch.setattr(observability, "_INITIALIZED", True)
    monkeypatch.setattr(observability, "_sentry_sdk", fake)

    assert observability.capture_exception(exc) == "event-id"
    assert fake.captured == [exc]
