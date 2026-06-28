import ast
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APPROVED_PYDANTIC_AI_IMPORTS = {
    Path("api/services/pydantic_ai_runtime.py"),
}


def _python_files() -> list[Path]:
    ignored_parts = {".git", ".venv", "__pycache__", ".pytest_cache"}
    return [
        path
        for path in ROOT.rglob("*.py")
        if not ignored_parts.intersection(path.relative_to(ROOT).parts)
    ]


def test_pydantic_ai_imports_stay_behind_runtime_adapter():
    violations: list[str] = []
    for path in _python_files():
        rel = path.relative_to(ROOT)
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(rel))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom):
                names = [node.module or ""]
            else:
                continue
            if any(name == "pydantic_ai" or name.startswith("pydantic_ai.") for name in names):
                if rel not in APPROVED_PYDANTIC_AI_IMPORTS:
                    violations.append(str(rel))

    assert violations == []


def test_pydantic_ai_requirement_uses_supported_v1_floor():
    requirements = (ROOT / "requirements.txt").read_text(encoding="utf-8")
    assert "pydantic-ai>=0.1.0,<1.0" not in requirements
    line = next(
        line.strip()
        for line in requirements.splitlines()
        if line.startswith("pydantic-ai")
    )
    assert ">=1.56.0" in line
    assert "<2.0" in line
    assert (ROOT / "api/services/pydantic_ai_runtime.py").is_file()


def test_runtime_install_paths_use_lockfile():
    render_yaml = (ROOT / "render.yaml").read_text(encoding="utf-8")
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "pip install -r requirements.lock" in render_yaml
    assert "pip install -r requirements.lock" in readme
