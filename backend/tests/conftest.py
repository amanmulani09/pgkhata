"""
Test configuration and fixtures for PGKhata backend tests.
"""

import os
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import get_db
from app.models import Base
from app.core.config import Settings
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.pg_structure import PG, Room, Bed
from app.models.tenant_management import Tenant, RentRecord


# Test database URL - use in-memory SQLite for speed
TEST_DATABASE_URL = "sqlite:///./test_database.db"

# Override settings for testing
@pytest.fixture
def test_settings():
    """Test settings fixture."""
    return Settings(
        secret_key="test-secret-key-for-testing-only",
        access_token_expire_minutes=30,
        algorithm="HS256",
        database_url=TEST_DATABASE_URL,
        admin_password="test-admin-password"
    )


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def engine():
    """Create test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    return engine


@pytest.fixture
def db_session(engine):
    """Create test database session."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Clean up - drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def override_get_db(db_session):
    """Override the get_db dependency for testing."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def async_client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def test_user_data():
    """Test user data."""
    return {
        "email": "testuser@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }


@pytest.fixture
def test_user(db_session, test_user_data):
    """Create a test user in the database."""
    user = User(
        email=test_user_data["email"],
        hashed_password=get_password_hash(test_user_data["password"]),
        full_name=test_user_data["full_name"]
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_token(test_user):
    """Create access token for test user."""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def auth_headers(test_user_token):
    """Authentication headers for API requests."""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def test_pg_data():
    """Test PG data."""
    return {
        "name": "Test PG",
        "description": "A test paying guest accommodation",
        "address": "123 Test Street, Test City",
        "contact_number": "9876543210"
    }


@pytest.fixture
def test_pg(db_session, test_user, test_pg_data):
    """Create a test PG in the database."""
    pg = PG(
        name=test_pg_data["name"],
        description=test_pg_data["description"],
        address=test_pg_data["address"],
        contact_number=test_pg_data["contact_number"],
        owner_id=test_user.id
    )
    db_session.add(pg)
    db_session.commit()
    db_session.refresh(pg)
    return pg


@pytest.fixture
def test_room_data():
    """Test room data."""
    return {
        "name": "Room 101",
        "description": "A comfortable room",
        "rent_amount": 5000.0
    }


@pytest.fixture
def test_room(db_session, test_pg, test_room_data):
    """Create a test room in the database."""
    room = Room(
        name=test_room_data["name"],
        description=test_room_data["description"],
        rent_amount=test_room_data["rent_amount"],
        pg_id=test_pg.id
    )
    db_session.add(room)
    db_session.commit()
    db_session.refresh(room)
    return room


@pytest.fixture
def test_bed_data():
    """Test bed data."""
    return {
        "bed_number": "B1",
        "description": "Single bed near window"
    }


@pytest.fixture
def test_bed(db_session, test_room, test_bed_data):
    """Create a test bed in the database."""
    bed = Bed(
        bed_number=test_bed_data["bed_number"],
        description=test_bed_data["description"],
        is_occupied=False,
        room_id=test_room.id
    )
    db_session.add(bed)
    db_session.commit()
    db_session.refresh(bed)
    return bed


@pytest.fixture
def test_occupied_bed(db_session, test_room):
    """Create an occupied test bed."""
    bed = Bed(
        bed_number="B2",
        description="Occupied bed",
        is_occupied=True,
        room_id=test_room.id
    )
    db_session.add(bed)
    db_session.commit()
    db_session.refresh(bed)
    return bed


@pytest.fixture
def test_tenant_data():
    """Test tenant data."""
    return {
        "name": "John Doe",
        "phone": "9876543210",
        "email": "john@example.com",
        "check_in_date": "2024-01-15",
        "emergency_contact_name": "Jane Doe",
        "emergency_contact_phone": "9876543211"
    }


@pytest.fixture
def test_tenant(db_session, test_bed, test_tenant_data, test_user):
    """Create a test tenant in the database."""
    from datetime import datetime

    tenant = Tenant(
        name=test_tenant_data["name"],
        phone=test_tenant_data["phone"],
        email=test_tenant_data["email"],
        check_in_date=datetime.strptime(test_tenant_data["check_in_date"], "%Y-%m-%d").date(),
        emergency_contact_name=test_tenant_data["emergency_contact_name"],
        emergency_contact_phone=test_tenant_data["emergency_contact_phone"],
        bed_id=test_bed.id,
        owner_id=test_user.id,
        status="active"
    )
    db_session.add(tenant)
    # Mark bed as occupied
    test_bed.is_occupied = True
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


@pytest.fixture
def test_rent_record(db_session, test_tenant, test_room):
    """Create a test rent record."""
    from datetime import datetime

    rent = RentRecord(
        tenant_id=test_tenant.id,
        month=datetime(2024, 1, 1).date(),
        amount_due=test_room.rent_amount,
        amount_paid=0.0,
        status="pending"
    )
    db_session.add(rent)
    db_session.commit()
    db_session.refresh(rent)
    return rent


# Additional utility fixtures
@pytest.fixture
def test_user_2(db_session):
    """Create a second test user for multi-tenancy tests."""
    user = User(
        email="testuser2@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User 2"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_2_token(test_user_2):
    """Create access token for second test user."""
    return create_access_token(data={"sub": test_user_2.email})


@pytest.fixture
def auth_headers_user_2(test_user_2_token):
    """Authentication headers for second test user."""
    return {"Authorization": f"Bearer {test_user_2_token}"}