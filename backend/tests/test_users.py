"""
Tests for user management functionality.
"""

import pytest
from httpx import AsyncClient


class TestUserCreation:
    """Test user creation and management."""

    @pytest.mark.integration
    async def test_create_user_success(self, async_client: AsyncClient, test_settings):
        """Test successful user creation with admin password."""
        user_data = {
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "New User",
            "admin_password": test_settings.admin_password
        }

        response = await async_client.post("/users/", json=user_data)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert data["id"] is not None
        assert "hashed_password" not in data  # Password should not be exposed

    @pytest.mark.integration
    async def test_create_user_invalid_admin_password(self, async_client: AsyncClient):
        """Test user creation with invalid admin password."""
        user_data = {
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "New User",
            "admin_password": "wrong_admin_password"
        }

        response = await async_client.post("/users/", json=user_data)

        assert response.status_code == 400
        assert "Invalid admin password" in response.json()["detail"]

    @pytest.mark.integration
    async def test_create_user_missing_admin_password(self, async_client: AsyncClient):
        """Test user creation without admin password."""
        user_data = {
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "New User"
        }

        response = await async_client.post("/users/", json=user_data)

        assert response.status_code == 422  # Validation error

    @pytest.mark.integration
    async def test_create_user_duplicate_email(self, async_client: AsyncClient, test_user, test_settings):
        """Test creating user with duplicate email address."""
        user_data = {
            "email": test_user.email,  # Using existing user's email
            "password": "strongpassword123",
            "full_name": "Duplicate User",
            "admin_password": test_settings.admin_password
        }

        response = await async_client.post("/users/", json=user_data)

        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]

    @pytest.mark.integration
    async def test_create_user_invalid_email(self, async_client: AsyncClient, test_settings):
        """Test user creation with invalid email format."""
        user_data = {
            "email": "invalid_email",
            "password": "strongpassword123",
            "full_name": "New User",
            "admin_password": test_settings.admin_password
        }

        response = await async_client.post("/users/", json=user_data)

        assert response.status_code == 422  # Validation error

    @pytest.mark.integration
    async def test_create_user_weak_password(self, async_client: AsyncClient, test_settings):
        """Test user creation with weak password."""
        user_data = {
            "email": "newuser@example.com",
            "password": "123",  # Weak password
            "full_name": "New User",
            "admin_password": test_settings.admin_password
        }

        response = await async_client.post("/users/", json=user_data)

        # This should pass validation (no password strength requirements implemented)
        # But it's good to document this behavior
        assert response.status_code == 200

    @pytest.mark.integration
    async def test_create_user_empty_full_name(self, async_client: AsyncClient, test_settings):
        """Test user creation with empty full name."""
        user_data = {
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "",
            "admin_password": test_settings.admin_password
        }

        response = await async_client.post("/users/", json=user_data)

        assert response.status_code == 200  # Empty full name is allowed
        data = response.json()
        assert data["full_name"] == ""

    @pytest.mark.integration
    async def test_create_user_missing_required_fields(self, async_client: AsyncClient, test_settings):
        """Test user creation with missing required fields."""
        # Missing email
        response = await async_client.post("/users/", json={
            "password": "strongpassword123",
            "full_name": "New User",
            "admin_password": test_settings.admin_password
        })
        assert response.status_code == 422

        # Missing password
        response = await async_client.post("/users/", json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "admin_password": test_settings.admin_password
        })
        assert response.status_code == 422

        # Missing full_name
        response = await async_client.post("/users/", json={
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "admin_password": test_settings.admin_password
        })
        assert response.status_code == 422


class TestUserRetrieval:
    """Test user information retrieval."""

    @pytest.mark.integration
    async def test_get_current_user_success(self, async_client: AsyncClient, auth_headers, test_user):
        """Test retrieving current user information."""
        response = await async_client.get("/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert "hashed_password" not in data

    @pytest.mark.integration
    async def test_get_current_user_unauthorized(self, async_client: AsyncClient):
        """Test retrieving current user without authentication."""
        response = await async_client.get("/users/me")

        assert response.status_code == 401

    @pytest.mark.integration
    async def test_get_current_user_invalid_token(self, async_client: AsyncClient):
        """Test retrieving current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await async_client.get("/users/me", headers=headers)

        assert response.status_code == 401

    @pytest.mark.integration
    async def test_get_user_by_id_success(self, async_client: AsyncClient, auth_headers, test_user):
        """Test retrieving user by ID."""
        response = await async_client.get(f"/users/{test_user.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name

    @pytest.mark.integration
    async def test_get_user_by_id_not_found(self, async_client: AsyncClient, auth_headers):
        """Test retrieving non-existent user by ID."""
        response = await async_client.get("/users/99999", headers=auth_headers)

        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    @pytest.mark.integration
    async def test_get_user_by_id_unauthorized(self, async_client: AsyncClient, test_user):
        """Test retrieving user by ID without authentication."""
        response = await async_client.get(f"/users/{test_user.id}")

        assert response.status_code == 401


class TestUserValidation:
    """Test user data validation."""

    @pytest.mark.unit
    def test_user_email_validation(self):
        """Test user email validation in Pydantic schema."""
        from app.schemas.user import UserCreate
        from pydantic import ValidationError

        # Valid email
        valid_user = UserCreate(
            email="test@example.com",
            password="password123",
            full_name="Test User",
            admin_password="admin123"
        )
        assert valid_user.email == "test@example.com"

        # Invalid email formats
        invalid_emails = [
            "notanemail",
            "@example.com",
            "test@",
            "test..test@example.com",
            ""
        ]

        for invalid_email in invalid_emails:
            with pytest.raises(ValidationError):
                UserCreate(
                    email=invalid_email,
                    password="password123",
                    full_name="Test User",
                    admin_password="admin123"
                )

    @pytest.mark.unit
    def test_user_password_validation(self):
        """Test user password validation."""
        from app.schemas.user import UserCreate

        # Valid password (no specific requirements implemented)
        user = UserCreate(
            email="test@example.com",
            password="any_password",
            full_name="Test User",
            admin_password="admin123"
        )
        assert user.password == "any_password"

        # Empty password should be rejected
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            UserCreate(
                email="test@example.com",
                password="",
                full_name="Test User",
                admin_password="admin123"
            )

    @pytest.mark.unit
    def test_user_schema_serialization(self):
        """Test user schema serialization excludes sensitive fields."""
        from app.schemas.user import User
        from app.models.user import User as UserModel

        user_model = UserModel(
            id=1,
            email="test@example.com",
            hashed_password="hashed_password_value",
            full_name="Test User"
        )

        user_schema = User.model_validate(user_model)
        user_dict = user_schema.model_dump()

        assert "hashed_password" not in user_dict
        assert user_dict["id"] == 1
        assert user_dict["email"] == "test@example.com"
        assert user_dict["full_name"] == "Test User"


class TestUserSecurity:
    """Test user security features."""

    @pytest.mark.integration
    async def test_password_is_hashed_in_database(self, async_client: AsyncClient, test_settings, db_session):
        """Test that passwords are properly hashed when stored."""
        from app.models.user import User as UserModel

        user_data = {
            "email": "securitytest@example.com",
            "password": "plaintext_password",
            "full_name": "Security Test User",
            "admin_password": test_settings.admin_password
        }

        response = await async_client.post("/users/", json=user_data)
        assert response.status_code == 200

        # Check database directly
        user_in_db = db_session.query(UserModel).filter(
            UserModel.email == user_data["email"]
        ).first()

        assert user_in_db is not None
        assert user_in_db.hashed_password != user_data["password"]  # Should be hashed
        assert user_in_db.hashed_password.startswith("$2b$")  # Bcrypt format

    @pytest.mark.integration
    async def test_user_cannot_see_others_hashed_password(self, async_client: AsyncClient, auth_headers, test_user_2):
        """Test that users cannot access other users' password hashes."""
        response = await async_client.get(f"/users/{test_user_2.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "hashed_password" not in data
        assert "password" not in data