# Testing Guide for PGKhata Backend

This guide shows you how to set up and run the comprehensive test suite for the PGKhata backend application.

## Prerequisites

1. Python 3.8+ installed
2. Virtual environment activated
3. Backend dependencies installed

## Setup Instructions

### 1. Install Test Dependencies

```bash
# Navigate to backend directory
cd backend

# Install test dependencies
pip install -r requirements-test.txt
```

### 2. Environment Setup

Create a test environment file if needed:

```bash
# Copy your existing .env or create a test-specific one
cp .env .env.test
```

Make sure your `.env.test` has:
```
SECRET_KEY=test-secret-key-for-testing-only
ADMIN_PASSWORD=test-admin-password
DATABASE_URL=sqlite:///./test_database.db
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run tests with coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run specific test class
pytest tests/test_auth.py::TestAuth

# Run specific test method
pytest tests/test_auth.py::TestAuth::test_login_success
```

### Running Tests by Category

```bash
# Run only authentication tests
pytest -m auth

# Run only PG management tests
pytest -m pg

# Run only tenant management tests
pytest -m tenant

# Run only rent management tests
pytest -m rent

# Run only integration tests
pytest -m integration

# Run only unit tests
pytest -m unit
```

### Advanced Test Running

```bash
# Run tests in parallel (install pytest-xdist first)
pip install pytest-xdist
pytest -n auto

# Run tests with specific output format
pytest --tb=short  # Short traceback
pytest --tb=long   # Long traceback
pytest --tb=line   # One line per failure

# Run tests and stop on first failure
pytest -x

# Run failed tests from last run
pytest --lf

# Run tests matching pattern
pytest -k "test_login"

# Run tests with specific verbosity
pytest -v -s  # -s shows print statements
```

## Test Structure Overview

```
tests/
├── __init__.py
├── conftest.py              # Test configuration and fixtures
├── test_auth.py            # Authentication and security tests
├── test_users.py           # User management tests
├── test_pgs.py             # PG CRUD tests
├── test_rooms_beds.py      # Room and bed management tests
├── test_tenants.py         # Tenant lifecycle tests
├── test_rents.py           # Rent management tests
├── test_dashboard.py       # Dashboard statistics tests (if created)
└── test_authorization.py   # Multi-tenancy and auth tests (if created)
```

## Test Categories

| Marker | Description | Example |
|--------|-------------|---------|
| `unit` | Unit tests for individual functions | `pytest -m unit` |
| `integration` | API endpoint tests | `pytest -m integration` |
| `auth` | Authentication related tests | `pytest -m auth` |
| `pg` | PG management tests | `pytest -m pg` |
| `tenant` | Tenant management tests | `pytest -m tenant` |
| `rent` | Rent management tests | `pytest -m rent` |
| `dashboard` | Dashboard tests | `pytest -m dashboard` |
| `slow` | Slower running tests | `pytest -m "not slow"` |

## Coverage Reports

```bash
# Generate HTML coverage report
pytest --cov=app --cov-report=html
# Opens htmlcov/index.html in browser

# Generate terminal coverage report
pytest --cov=app --cov-report=term

# Generate coverage with missing lines
pytest --cov=app --cov-report=term-missing

# Set minimum coverage threshold
pytest --cov=app --cov-fail-under=80
```

## Common Test Scenarios

### Testing Complete User Flow
```bash
# Test user creation → login → PG creation → tenant management
pytest tests/test_users.py::TestUserCreation::test_create_user_success \
       tests/test_auth.py::TestAuth::test_login_success \
       tests/test_pgs.py::TestPGCRUD::test_create_pg_success \
       tests/test_tenants.py::TestTenantCheckin::test_tenant_checkin_success
```

### Testing Error Handling
```bash
# Run tests that check error conditions
pytest -k "invalid or unauthorized or not_found"
```

### Testing Database Operations
```bash
# Run tests that involve database operations
pytest -k "create or update or delete"
```

## Debugging Tests

### Running Tests in Debug Mode
```bash
# Run with Python debugger
pytest --pdb

# Run specific test with debugger
pytest --pdb tests/test_auth.py::TestAuth::test_login_success

# Drop into debugger on failures only
pytest --pdb-trace
```

### Verbose Output
```bash
# Show all print statements and logs
pytest -v -s

# Show local variables in traceback
pytest --tb=long --showlocals
```

## Common Issues and Solutions

### 1. Database Connection Issues
```bash
# Make sure test database is properly configured
export DATABASE_URL=sqlite:///./test_database.db
pytest
```

### 2. Import Errors
```bash
# Make sure you're in the backend directory and virtual environment is activated
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pytest
```

### 3. Fixture Not Found
```bash
# Make sure conftest.py is in the tests directory
ls tests/conftest.py
pytest --fixtures  # List all available fixtures
```

### 4. Authentication Errors in Tests
```bash
# Check if test settings are properly configured
pytest tests/test_auth.py -v
```

## CI/CD Integration

For GitHub Actions or similar CI systems:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-test.txt
          pytest --cov=app --cov-report=xml
```

## Performance Testing

```bash
# Install pytest-benchmark for performance tests
pip install pytest-benchmark

# Run performance tests (if any)
pytest --benchmark-only

# Run tests and show slowest tests
pytest --durations=10
```

## Test Data Management

The tests use fixtures defined in `conftest.py`:
- `test_user`: Creates a test user
- `test_pg`: Creates a test PG
- `test_room`: Creates a test room
- `test_bed`: Creates a test bed
- `test_tenant`: Creates a test tenant
- `test_rent_record`: Creates a test rent record

Each test is isolated and uses a fresh database state.

## Best Practices

1. **Always run tests before committing code**
2. **Run specific test categories during development**
3. **Use coverage reports to identify untested code**
4. **Keep tests isolated and independent**
5. **Use descriptive test names and docstrings**
6. **Clean up test data automatically (handled by fixtures)**

## Quick Start Example

```bash
# Complete setup and test run
cd backend
pip install -r requirements-test.txt
pytest -v --cov=app --cov-report=term-missing
```

This will run all tests with verbose output and show coverage information.