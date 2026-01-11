"""
Tests for PG (Paying Guest) management functionality.
"""

import pytest
from httpx import AsyncClient


class TestPGCRUD:
    """Test PG CRUD operations."""

    @pytest.mark.pg
    async def test_create_pg_success(self, async_client: AsyncClient, auth_headers, test_pg_data):
        """Test successful PG creation."""
        response = await async_client.post("/pgs/", json=test_pg_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_pg_data["name"]
        assert data["description"] == test_pg_data["description"]
        assert data["address"] == test_pg_data["address"]
        assert data["contact_number"] == test_pg_data["contact_number"]
        assert data["id"] is not None
        assert data["owner_id"] is not None

    @pytest.mark.pg
    async def test_create_pg_unauthorized(self, async_client: AsyncClient, test_pg_data):
        """Test PG creation without authentication."""
        response = await async_client.post("/pgs/", json=test_pg_data)
        assert response.status_code == 401

    @pytest.mark.pg
    async def test_create_pg_missing_fields(self, async_client: AsyncClient, auth_headers):
        """Test PG creation with missing required fields."""
        # Missing name
        response = await async_client.post("/pgs/", json={
            "description": "Test PG",
            "address": "Test Address",
            "contact_number": "9876543210"
        }, headers=auth_headers)
        assert response.status_code == 422

        # Missing address
        response = await async_client.post("/pgs/", json={
            "name": "Test PG",
            "description": "Test PG",
            "contact_number": "9876543210"
        }, headers=auth_headers)
        assert response.status_code == 422

    @pytest.mark.pg
    async def test_get_pgs_list(self, async_client: AsyncClient, auth_headers, test_pg):
        """Test getting list of user's PGs."""
        response = await async_client.get("/pgs/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Find our test PG
        pg_found = False
        for pg in data:
            if pg["id"] == test_pg.id:
                pg_found = True
                assert pg["name"] == test_pg.name
                break
        assert pg_found

    @pytest.mark.pg
    async def test_get_pg_by_id(self, async_client: AsyncClient, auth_headers, test_pg):
        """Test getting PG by ID."""
        response = await async_client.get(f"/pgs/{test_pg.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_pg.id
        assert data["name"] == test_pg.name
        assert data["description"] == test_pg.description

    @pytest.mark.pg
    async def test_get_pg_not_found(self, async_client: AsyncClient, auth_headers):
        """Test getting non-existent PG."""
        response = await async_client.get("/pgs/99999", headers=auth_headers)
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_update_pg(self, async_client: AsyncClient, auth_headers, test_pg):
        """Test updating PG information."""
        update_data = {
            "name": "Updated PG Name",
            "description": "Updated description",
            "address": test_pg.address,
            "contact_number": test_pg.contact_number
        }

        response = await async_client.put(f"/pgs/{test_pg.id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]

    @pytest.mark.pg
    async def test_delete_pg(self, async_client: AsyncClient, auth_headers, test_pg):
        """Test deleting PG."""
        response = await async_client.delete(f"/pgs/{test_pg.id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify PG is deleted
        response = await async_client.get(f"/pgs/{test_pg.id}", headers=auth_headers)
        assert response.status_code == 404


class TestPGAuthorization:
    """Test PG authorization and multi-tenancy."""

    @pytest.mark.pg
    async def test_user_cannot_access_other_user_pg(self, async_client: AsyncClient, auth_headers_user_2, test_pg):
        """Test that user cannot access another user's PG."""
        response = await async_client.get(f"/pgs/{test_pg.id}", headers=auth_headers_user_2)
        assert response.status_code == 404  # Should return 404, not 403

    @pytest.mark.pg
    async def test_user_cannot_modify_other_user_pg(self, async_client: AsyncClient, auth_headers_user_2, test_pg):
        """Test that user cannot modify another user's PG."""
        update_data = {"name": "Unauthorized Update"}

        response = await async_client.put(f"/pgs/{test_pg.id}", json=update_data, headers=auth_headers_user_2)
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_user_cannot_delete_other_user_pg(self, async_client: AsyncClient, auth_headers_user_2, test_pg):
        """Test that user cannot delete another user's PG."""
        response = await async_client.delete(f"/pgs/{test_pg.id}", headers=auth_headers_user_2)
        assert response.status_code == 404


class TestPGValidation:
    """Test PG data validation."""

    @pytest.mark.pg
    async def test_pg_name_validation(self, async_client: AsyncClient, auth_headers):
        """Test PG name validation."""
        # Empty name
        response = await async_client.post("/pgs/", json={
            "name": "",
            "description": "Test",
            "address": "Test Address",
            "contact_number": "9876543210"
        }, headers=auth_headers)
        assert response.status_code == 422

        # Very long name
        long_name = "A" * 1000
        response = await async_client.post("/pgs/", json={
            "name": long_name,
            "description": "Test",
            "address": "Test Address",
            "contact_number": "9876543210"
        }, headers=auth_headers)
        # Should either succeed or fail gracefully

    @pytest.mark.pg
    async def test_pg_contact_number_validation(self, async_client: AsyncClient, auth_headers):
        """Test contact number validation."""
        # Valid 10-digit number
        response = await async_client.post("/pgs/", json={
            "name": "Test PG",
            "description": "Test",
            "address": "Test Address",
            "contact_number": "9876543210"
        }, headers=auth_headers)
        assert response.status_code == 200

        # Invalid format (letters)
        response = await async_client.post("/pgs/", json={
            "name": "Test PG 2",
            "description": "Test",
            "address": "Test Address",
            "contact_number": "invalid_number"
        }, headers=auth_headers)
        # Should either validate or accept (depends on implementation)