"""
Tests for authentication and login flows.
"""

import pytest
from httpx import AsyncClient
from app.core.security import verify_password, create_access_token, decode_access_token


class TestAuth:
    """Test authentication functionality."""

    @pytest.mark.auth
    async def test_login_success(self, async_client: AsyncClient, test_user, test_user_data):
        """Test successful login with valid credentials."""
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }

        response = await async_client.post("/login/access-token", data=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # Verify token is valid
        token_data = decode_access_token(data["access_token"])
        assert token_data["sub"] == test_user.email

    @pytest.mark.auth
    async def test_login_invalid_email(self, async_client: AsyncClient, test_user_data):
        """Test login with invalid email."""
        login_data = {
            "username": "nonexistent@example.com",
            "password": test_user_data["password"]
        }

        response = await async_client.post("/login/access-token", data=login_data)

        assert response.status_code == 400
        assert "Incorrect email or password" in response.json()["detail"]

    @pytest.mark.auth
    async def test_login_invalid_password(self, async_client: AsyncClient, test_user, test_user_data):
        """Test login with invalid password."""
        login_data = {
            "username": test_user_data["email"],
            "password": "wrongpassword"
        }

        response = await async_client.post("/login/access-token", data=login_data)

        assert response.status_code == 400
        assert "Incorrect email or password" in response.json()["detail"]

    @pytest.mark.auth
    async def test_login_missing_credentials(self, async_client: AsyncClient):
        """Test login with missing credentials."""
        # Missing password
        response = await async_client.post("/login/access-token", data={"username": "test@example.com"})
        assert response.status_code == 422

        # Missing username
        response = await async_client.post("/login/access-token", data={"password": "password"})
        assert response.status_code == 422

        # Empty request
        response = await async_client.post("/login/access-token", data={})
        assert response.status_code == 422

    @pytest.mark.auth
    async def test_protected_endpoint_without_token(self, async_client: AsyncClient):
        """Test accessing protected endpoint without authentication token."""
        response = await async_client.get("/users/me")
        assert response.status_code == 401

    @pytest.mark.auth
    async def test_protected_endpoint_invalid_token(self, async_client: AsyncClient):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await async_client.get("/users/me", headers=headers)
        assert response.status_code == 401

    @pytest.mark.auth
    async def test_protected_endpoint_expired_token(self, async_client: AsyncClient, test_user):
        """Test accessing protected endpoint with expired token."""
        # Create token with negative expiration (already expired)
        expired_token = create_access_token(
            data={"sub": test_user.email},
            expires_delta_minutes=-1
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await async_client.get("/users/me", headers=headers)
        assert response.status_code == 401

    @pytest.mark.auth
    async def test_get_current_user(self, async_client: AsyncClient, auth_headers, test_user):
        """Test getting current user information."""
        response = await async_client.get("/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["id"] == test_user.id
        assert "hashed_password" not in data  # Password should not be exposed

    @pytest.mark.auth
    async def test_token_format(self, async_client: AsyncClient, test_user, test_user_data):
        """Test that login returns properly formatted token."""
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }

        response = await async_client.post("/login/access-token", data=login_data)
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 50  # JWT tokens are quite long


class TestPasswordSecurity:
    """Test password hashing and verification."""

    @pytest.mark.unit
    def test_password_hashing(self):
        """Test password hashing functionality."""
        from app.core.security import get_password_hash

        password = "testpassword123"
        hashed = get_password_hash(password)

        assert hashed != password  # Should be hashed, not plain text
        assert len(hashed) > 50  # Bcrypt hashes are quite long
        assert hashed.startswith("$2b$")  # Bcrypt format

    @pytest.mark.unit
    def test_password_verification(self):
        """Test password verification functionality."""
        from app.core.security import get_password_hash

        password = "testpassword123"
        hashed = get_password_hash(password)

        # Correct password should verify
        assert verify_password(password, hashed) is True

        # Wrong password should not verify
        assert verify_password("wrongpassword", hashed) is False
        assert verify_password("", hashed) is False

    @pytest.mark.unit
    def test_different_passwords_different_hashes(self):
        """Test that same password generates different hashes (salt)."""
        from app.core.security import get_password_hash

        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Different hashes due to random salt
        assert hash1 != hash2
        # But both should verify the same password
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestTokenSecurity:
    """Test JWT token functionality."""

    @pytest.mark.unit
    def test_create_and_decode_token(self):
        """Test token creation and decoding."""
        email = "test@example.com"
        token = create_access_token(data={"sub": email})

        assert isinstance(token, str)
        assert len(token) > 50

        # Decode token
        decoded = decode_access_token(token)
        assert decoded["sub"] == email
        assert "exp" in decoded  # Expiration should be set

    @pytest.mark.unit
    def test_token_expiration(self):
        """Test token expiration functionality."""
        email = "test@example.com"

        # Create token with 30 minute expiration
        token = create_access_token(data={"sub": email}, expires_delta_minutes=30)
        decoded = decode_access_token(token)

        import time
        current_time = time.time()
        token_exp = decoded["exp"]

        # Token should expire in the future (approximately 30 minutes)
        assert token_exp > current_time
        assert token_exp < current_time + 31 * 60  # Less than 31 minutes

    @pytest.mark.unit
    def test_invalid_token_decode(self):
        """Test decoding invalid tokens."""
        # Invalid token should return None or raise exception
        with pytest.raises(Exception):
            decode_access_token("invalid.token.here")

        with pytest.raises(Exception):
            decode_access_token("not_a_jwt_token")

        with pytest.raises(Exception):
            decode_access_token("")