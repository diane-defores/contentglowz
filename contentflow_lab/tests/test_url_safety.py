import pytest

from api.services.url_safety import URLSafetyError, validate_public_http_url


def _resolver(addresses):
    return lambda _host, _port: addresses


def test_validate_public_http_url_normalizes_public_domains():
    assert (
        validate_public_http_url(
            " HTTP://Example.COM:443/docs?q=1 ",
            resolver=_resolver(["93.184.216.34"]),
        )
        == "http://example.com:443/docs?q=1"
    )


@pytest.mark.parametrize(
    ("url", "resolver"),
    [
        ("", _resolver(["93.184.216.34"])),
        ("ftp://example.com", _resolver(["93.184.216.34"])),
        ("https://user:pass@example.com", _resolver(["93.184.216.34"])),
        ("http://localhost", _resolver(["127.0.0.1"])),
        ("http://127.0.0.1", _resolver([])),
        ("http://10.0.0.5", _resolver([])),
        ("http://169.254.169.254/latest/meta-data", _resolver([])),
        ("http://[::1]/", _resolver([])),
        ("http://example.test", _resolver(["10.0.0.5"])),
        ("http://example.test", _resolver(["93.184.216.34", "10.0.0.5"])),
    ],
)
def test_validate_public_http_url_rejects_unsafe_urls(url, resolver):
    with pytest.raises(URLSafetyError):
        validate_public_http_url(url, resolver=resolver)
