# Test Structure Documentation

This directory contains the organized test suite for the my-robots multi-agent SEO system.

## 📁 Directory Structure

```
tests/
├── conftest.py                    # Shared pytest configuration and fixtures
├── __init__.py                    # Makes tests a Python package
├── unit/                          # Unit tests (isolated components)
│   ├── agents/                    # Individual agent tests
│   │   ├── test_research_analyst.py    # Research Analyst agent tests
│   │   └── test_topical_mesh.py       # Topical Mesh agent tests
│   ├── tools/                     # Tool function tests
│   │   └── test_advertools.py          # Advertools integration tests
│   └── utils/                     # Utility tests
│       └── test_research_simple.py      # Basic research functionality tests
├── integration/                   # Integration tests (component interaction)
│   ├── test_seo_system.py        # Full 6-agent pipeline tests
│   ├── test_storm_integration.py # STORM framework integration tests
│   └── test_existing_mesh.py     # Website mesh analysis tests
├── e2e/                          # End-to-end tests (full workflows)
│   └── test_topical_mesh_simple.py # Simplified workflow tests
└── fixtures/                     # Test data and helpers
    ├── __init__.py
    ├── sample_data.py            # Sample test data fixtures
    └── mock_responses.py        # Mock API responses
```

## 🏷️ Test Markers

Tests are categorized using pytest markers:

- `@pytest.mark.unit` - Unit tests for isolated components
- `@pytest.mark.integration` - Integration tests for component interaction
- `@pytest.mark.e2e` - End-to-end tests for complete workflows
- `@pytest.mark.slow` - Tests taking more than 30 seconds
- `@pytest.mark.external` - Tests requiring external APIs/services
- `@pytest.mark.agents` - Tests specifically for agent components
- `@pytest.mark.tools` - Tests for tool functions

## 🚀 Running Tests

### Using the Test Runner (Recommended)

```bash
# Make sure you're in the Flox environment
flox activate

# Run with Doppler for secrets
doppler run -- python3 test_runner.py [command]
```

#### Available Commands

```bash
# Run all tests
python3 test_runner.py all

# Run specific categories
python3 test_runner.py unit          # Unit tests only
python3 test_runner.py integration   # Integration tests only
python3 test_runner.py e2e           # End-to-end tests only
python3 test_runner.py agents        # Agent tests only
python3 test_runner.py tools         # Tool tests only

# Run fast tests (exclude slow ones)
python3 test_runner.py fast

# Run with coverage report
python3 test_runner.py coverage

# Run specific test file
python3 test_runner.py specific tests/unit/agents/test_research_analyst.py
```

### Using pytest Directly

```bash
# All tests with markers
pytest -v
pytest -m unit -v                    # Unit tests only
pytest -m integration -v             # Integration tests only
pytest -m "not slow" -v              # Fast tests only
pytest -m "unit and agents" -v       # Unit agent tests

# With coverage
pytest --cov=agents --cov=api --cov=utils --cov-report=html

# Specific test file
pytest tests/unit/agents/test_research_analyst.py -v
```

## 🛠️ Environment Setup

### Required Environment Variables

Tests automatically set up mock API keys, but for integration tests you'll need:

```bash
# Set via Doppler
doppler secrets set OPENROUTER_API_KEY=your_key
doppler secrets set SERP_API_KEY=your_key
doppler secrets set EXA_API_KEY=your_key
doppler secrets set YDC_API_KEY=your_key
```

### Test Mode

All tests automatically set:
- `TESTING=true` - Enables test mode
- `LOG_LEVEL=DEBUG` - Verbose logging
- Mock API keys for isolated testing

## 📋 Test Categories

### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual components in isolation
- **Speed**: Fast (< 1 second)
- **Dependencies**: Mocked external services
- **Examples**: 
  - Individual agent initialization
  - Tool function logic
  - Utility function behavior

### Integration Tests (`tests/integration/`)
- **Purpose**: Test component interactions
- **Speed**: Medium (1-10 seconds)
- **Dependencies**: May require real APIs
- **Examples**:
  - Agent collaboration workflows
  - API endpoint testing
  - Database operations

### End-to-End Tests (`tests/e2e/`)
- **Purpose**: Test complete workflows
- **Speed**: Slow (10+ seconds)
- **Dependencies**: Full system setup
- **Examples**:
  - Complete SEO analysis pipeline
  - Real-world scenario testing

## 🔧 Fixtures and Mocks

### Key Fixtures

- `mock_llm` - Mock LLM responses for agent testing
- `sample_serp_data` - Sample SERP analysis data
- `sample_topical_mesh` - Sample mesh structure
- `mock_serp_api` - Mock SERP API responses
- `sample_agent_config` - Sample agent configuration

### Mock Data

Location: `tests/fixtures/`
- `sample_data.py` - Sample datasets and constants
- `mock_responses.py` - Mock API responses and utilities

## 📊 Best Practices

### Writing Tests

1. **Use appropriate markers** - Mark tests with correct category
2. **Follow naming conventions** - `test_*.py` files, `test_*` functions
3. **Use fixtures** - Leverage shared fixtures for common setup
4. **Mock external services** - Don't rely on real APIs in unit tests
5. **Test edge cases** - Include error conditions and boundary cases

### Test Organization

1. **Unit tests first** - Most tests should be unit tests
2. **Integration tests for workflows** - Test component interactions
3. **E2E tests sparingly** - Only for critical user journeys
4. **Use descriptive names** - Test names should explain what's being tested

### Running Tests

1. **Run fast tests locally** - Use `python3 test_runner.py fast` during development
2. **Run full suite before commits** - Use `python3 test_runner.py all`
3. **Check coverage** - Use `python3 test_runner.py coverage` to ensure good coverage
4. **Use markers for CI** - Configure CI to run different test categories

## 🔍 Test Discovery

Pytest automatically discovers tests based on:
- Files matching `test_*.py` or `*_test.py`
- Functions matching `test_*`
- Classes matching `Test*`

Our structure uses `test_*.py` pattern exclusively.

## 📈 Coverage Reports

Generate coverage reports with:

```bash
# HTML report (detailed)
python3 test_runner.py coverage

# Terminal output
pytest --cov=agents --cov=api --cov=utils --cov-report=term-missing
```

Coverage files are generated in `htmlcov/` directory.

## 🚨 Common Issues

### Import Errors
- Ensure project root is in `PYTHONPATH` (handled by conftest.py)
- Check Flox environment is activated
- Run with `doppler run --` for proper environment variables

### External API Failures
- Check API keys are set in Doppler
- Use `-m "not external"` to skip external API tests
- Mock responses are available in `tests/fixtures/mock_responses.py`

### Slow Tests
- Use `-m "not slow"` to skip slow tests during development
- Mark slow tests with `@pytest.mark.slow`

## 🎯 Migration from Root Tests

The 8 original test files have been organized as follows:

| Original File | New Location | Category |
|---------------|--------------|----------|
| `test_research_analyst.py` | `tests/unit/agents/` | Unit + Agents |
| `test_topical_mesh.py` | `tests/unit/agents/` | Unit + Agents |
| `test_advertools.py` | `tests/unit/tools/` | Unit + Tools |
| `test_research_simple.py` | `tests/unit/utils/` | Unit |
| `test_seo_system.py` | `tests/integration/` | Integration |
| `test_storm_integration.py` | `tests/integration/` | Integration + External + Slow |
| `test_existing_mesh.py` | `tests/integration/` | Integration + External |
| `test_topical_mesh_simple.py` | `tests/e2e/` | E2E |

This organization provides clear separation of concerns and makes tests easier to discover and run based on their purpose and complexity.