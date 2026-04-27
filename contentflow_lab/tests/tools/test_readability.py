"""Tests for QualityChecker readability scoring."""
import sys
import pytest
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import importlib
# Import directly to avoid crewai dependency chain via __init__.py
spec = importlib.util.spec_from_file_location(
    "editing_tools",
    project_root / "agents" / "seo" / "tools" / "editing_tools.py",
)
editing_tools = importlib.util.module_from_spec(spec)
spec.loader.exec_module(editing_tools)
QualityChecker = editing_tools.QualityChecker


SIMPLE_TEXT = (
    "The cat sat on the mat. The dog ran in the park. "
    "Birds fly in the sky. Fish swim in the sea. "
    "Kids play on the grass. The sun is very bright today."
)

COMPLEX_TEXT = (
    "The epistemological ramifications of quantum decoherence within "
    "the contextual framework of post-structuralist philosophical "
    "paradigms necessitate a comprehensive re-evaluation of our "
    "ontological presuppositions regarding the fundamental nature "
    "of consciousness and its phenomenological manifestations."
)


@pytest.mark.unit
@pytest.mark.tools
class TestQualityChecker:

    def setup_method(self):
        self.checker = QualityChecker()

    def test_basic_output_structure(self):
        result = self.checker.check_quality(SIMPLE_TEXT, min_words=5)
        assert "word_count" in result
        assert "flesch_reading_ease" in result
        assert "readability_level" in result
        assert "quality_grade" in result
        assert "issues" in result

    def test_simple_text_scores_high(self):
        result = self.checker.check_quality(SIMPLE_TEXT, min_words=5)
        assert result["flesch_reading_ease"] > 60

    def test_complex_text_scores_low(self):
        result = self.checker.check_quality(COMPLEX_TEXT, min_words=5)
        assert result["flesch_reading_ease"] < 50

    def test_textstat_metrics_present(self):
        """When textstat is available, extra metrics should be populated."""
        result = self.checker.check_quality(SIMPLE_TEXT, min_words=5)
        try:
            import textstat  # noqa: F401
            assert result["gunning_fog"] is not None
            assert result["smog_index"] is not None
            assert result["coleman_liau"] is not None
            assert result["flesch_kincaid_grade"] is not None
        except ImportError:
            assert result["gunning_fog"] is None

    def test_min_words_issue(self):
        result = self.checker.check_quality("Short text here.", min_words=1000)
        assert any("Word count below minimum" in i for i in result["issues"])

    def test_grade_a_for_good_content(self):
        # Realistic web content at 8th-9th grade level (Flesch 60-70)
        good = (
            "Content marketing helps businesses grow their audience. "
            "A good strategy starts with understanding your customers. "
            "You should research what topics matter to them. "
            "Then create articles that answer their questions clearly. "
            "Use short paragraphs and simple words when possible. "
            "Include data and examples to support your points. "
            "Track your results with analytics tools each month. "
            "Adjust your plan based on what the numbers tell you. "
        ) * 25
        result = self.checker.check_quality(good, min_words=100)
        assert result["quality_grade"] in ("A", "B")
