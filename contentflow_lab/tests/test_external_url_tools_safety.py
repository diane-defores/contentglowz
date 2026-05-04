import importlib
import sys
import types


def _install_crewai_tool_stub(monkeypatch):
    try:
        import crewai.tools  # noqa: F401
    except ImportError:
        pass
    else:
        return

    crewai = types.ModuleType("crewai")
    tools = types.ModuleType("crewai.tools")
    tools.tool = lambda _name: (lambda fn: fn)
    monkeypatch.setitem(sys.modules, "crewai", crewai)
    monkeypatch.setitem(sys.modules, "crewai.tools", tools)


def _fresh_import(monkeypatch, module_name):
    _install_crewai_tool_stub(monkeypatch)
    sys.modules.pop(module_name, None)
    return importlib.import_module(module_name)


def _invoke_tool(tool_obj, *args, **kwargs):
    if hasattr(tool_obj, "run"):
        return tool_obj.run(*args, **kwargs)
    return tool_obj(*args, **kwargs)


def test_firecrawl_rejects_unsafe_urls_before_client_creation(monkeypatch):
    module = _fresh_import(monkeypatch, "agents.shared.tools.firecrawl_tools")
    called = False

    def fail_get_client():
        nonlocal called
        called = True
        raise AssertionError("provider should not be called")

    monkeypatch.setattr(module, "_get_client", fail_get_client)

    result = _invoke_tool(module.scrape_url, "http://127.0.0.1/private")

    assert "Unsafe URL rejected" in result
    assert called is False


def test_exa_rejects_unsafe_similar_url_before_client_creation(monkeypatch):
    module = _fresh_import(monkeypatch, "agents.shared.tools.exa_tools")
    called = False

    def fail_get_client():
        nonlocal called
        called = True
        raise AssertionError("provider should not be called")

    monkeypatch.setattr(module, "_get_client", fail_get_client)

    result = _invoke_tool(module.exa_find_similar, "http://10.0.0.8/page")

    assert "Unsafe URL rejected" in result
    assert called is False


def test_exa_rejects_unsafe_content_urls_before_client_creation(monkeypatch):
    module = _fresh_import(monkeypatch, "agents.shared.tools.exa_tools")
    called = False

    def fail_get_client():
        nonlocal called
        called = True
        raise AssertionError("provider should not be called")

    monkeypatch.setattr(module, "_get_client", fail_get_client)

    result = _invoke_tool(
        module.exa_get_contents,
        "https://example.com, http://169.254.169.254/latest",
    )

    assert "Unsafe URL rejected" in result
    assert called is False
