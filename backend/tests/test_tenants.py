"""
Tests for tenant lifecycle management functionality.
"""

import pytest
from httpx import AsyncClient
from datetime import date, datetime


class TestTenantCheckin:
    """Test tenant check-in process."""

    @pytest.mark.tenant
    async def test_tenant_checkin_success(self, async_client: AsyncClient, auth_headers, test_bed, test_tenant_data):
        """Test successful tenant check-in."""
        tenant_data = {**test_tenant_data, "bed_id": test_bed.id}

        response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == tenant_data["name"]
        assert data["phone"] == tenant_data["phone"]
        assert data["email"] == tenant_data["email"]
        assert data["bed_id"] == test_bed.id
        assert data["status"] == "active"
        assert data["check_in_date"] == tenant_data["check_in_date"]

    @pytest.mark.tenant
    async def test_tenant_checkin_occupied_bed(self, async_client: AsyncClient, auth_headers, test_occupied_bed, test_tenant_data):
        """Test tenant check-in to already occupied bed should fail."""
        tenant_data = {**test_tenant_data, "bed_id": test_occupied_bed.id}

        response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers)

        assert response.status_code == 400
        assert "Bed is already occupied" in response.json()["detail"]

    @pytest.mark.tenant
    async def test_tenant_checkin_nonexistent_bed(self, async_client: AsyncClient, auth_headers, test_tenant_data):
        """Test tenant check-in to non-existent bed."""
        tenant_data = {**test_tenant_data, "bed_id": 99999}

        response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers)

        assert response.status_code == 404
        assert "Bed not found" in response.json()["detail"]

    @pytest.mark.tenant
    async def test_tenant_checkin_unauthorized_bed(self, async_client: AsyncClient, auth_headers_user_2, test_bed, test_tenant_data):
        """Test tenant check-in to another user's bed."""
        tenant_data = {**test_tenant_data, "bed_id": test_bed.id}

        response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers_user_2)

        assert response.status_code == 404

    @pytest.mark.tenant
    async def test_tenant_checkin_marks_bed_occupied(self, async_client: AsyncClient, auth_headers, test_bed, test_tenant_data, db_session):
        """Test that check-in marks bed as occupied."""
        from app.models.pg_structure import Bed

        # Verify bed is initially unoccupied
        assert test_bed.is_occupied is False

        tenant_data = {**test_tenant_data, "bed_id": test_bed.id}
        response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers)

        assert response.status_code == 200

        # Refresh bed from database and check it's now occupied
        db_session.refresh(test_bed)
        assert test_bed.is_occupied is True

    @pytest.mark.tenant
    async def test_tenant_checkin_creates_rent_record(self, async_client: AsyncClient, auth_headers, test_bed, test_tenant_data, test_room, db_session):
        """Test that check-in creates initial rent record."""
        from app.models.tenant_management import RentRecord

        tenant_data = {**test_tenant_data, "bed_id": test_bed.id}
        response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers)

        assert response.status_code == 200
        tenant_id = response.json()["id"]

        # Check that rent record was created
        rent_record = db_session.query(RentRecord).filter(
            RentRecord.tenant_id == tenant_id
        ).first()

        assert rent_record is not None
        assert rent_record.amount_due == test_room.rent_amount
        assert rent_record.status == "pending"

    @pytest.mark.tenant
    async def test_tenant_checkin_prorated_rent(self, async_client: AsyncClient, auth_headers, test_bed, test_room, db_session):
        """Test prorated rent calculation for mid-month check-in."""
        # Check-in on 15th of month
        tenant_data = {
            "name": "Mid Month Tenant",
            "phone": "9876543210",
            "email": "midmonth@example.com",
            "check_in_date": "2024-01-15",  # 15th of month
            "emergency_contact_name": "Emergency Contact",
            "emergency_contact_phone": "9876543211",
            "bed_id": test_bed.id
        }

        response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers)
        assert response.status_code == 200

        from app.models.tenant_management import RentRecord
        tenant_id = response.json()["id"]
        rent_record = db_session.query(RentRecord).filter(
            RentRecord.tenant_id == tenant_id
        ).first()

        # Should be approximately half the rent for mid-month check-in
        expected_prorated = test_room.rent_amount * 0.5
        assert abs(rent_record.amount_due - expected_prorated) < test_room.rent_amount * 0.1

    @pytest.mark.tenant
    async def test_tenant_checkin_validation(self, async_client: AsyncClient, auth_headers, test_bed):
        """Test tenant check-in data validation."""
        # Missing required fields
        response = await async_client.post("/tenants/", json={
            "bed_id": test_bed.id
        }, headers=auth_headers)
        assert response.status_code == 422

        # Invalid email
        response = await async_client.post("/tenants/", json={
            "name": "Test Tenant",
            "phone": "9876543210",
            "email": "invalid_email",
            "check_in_date": "2024-01-15",
            "emergency_contact_name": "Emergency",
            "emergency_contact_phone": "9876543211",
            "bed_id": test_bed.id
        }, headers=auth_headers)
        assert response.status_code == 422

        # Invalid date format
        response = await async_client.post("/tenants/", json={
            "name": "Test Tenant",
            "phone": "9876543210",
            "email": "test@example.com",
            "check_in_date": "invalid_date",
            "emergency_contact_name": "Emergency",
            "emergency_contact_phone": "9876543211",
            "bed_id": test_bed.id
        }, headers=auth_headers)
        assert response.status_code == 422


class TestTenantCheckout:
    """Test tenant check-out process."""

    @pytest.mark.tenant
    async def test_tenant_checkout_success(self, async_client: AsyncClient, auth_headers, test_tenant, test_bed, db_session):
        """Test successful tenant check-out."""
        response = await async_client.post(f"/tenants/{test_tenant.id}/checkout", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "checked_out"
        assert data["check_out_date"] is not None

        # Verify bed is no longer occupied
        db_session.refresh(test_bed)
        assert test_bed.is_occupied is False

    @pytest.mark.tenant
    async def test_tenant_checkout_nonexistent(self, async_client: AsyncClient, auth_headers):
        """Test check-out of non-existent tenant."""
        response = await async_client.post("/tenants/99999/checkout", headers=auth_headers)
        assert response.status_code == 404

    @pytest.mark.tenant
    async def test_tenant_checkout_unauthorized(self, async_client: AsyncClient, auth_headers_user_2, test_tenant):
        """Test check-out of another user's tenant."""
        response = await async_client.post(f"/tenants/{test_tenant.id}/checkout", headers=auth_headers_user_2)
        assert response.status_code == 404

    @pytest.mark.tenant
    async def test_tenant_checkout_already_checked_out(self, async_client: AsyncClient, auth_headers, test_tenant):
        """Test check-out of already checked-out tenant."""
        # First check-out
        response = await async_client.post(f"/tenants/{test_tenant.id}/checkout", headers=auth_headers)
        assert response.status_code == 200

        # Second check-out should fail
        response = await async_client.post(f"/tenants/{test_tenant.id}/checkout", headers=auth_headers)
        assert response.status_code == 400
        assert "already checked out" in response.json()["detail"].lower()


class TestTenantCRUD:
    """Test tenant CRUD operations."""

    @pytest.mark.tenant
    async def test_get_tenants_list(self, async_client: AsyncClient, auth_headers, test_tenant):
        """Test getting list of tenants."""
        response = await async_client.get("/tenants/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Find our test tenant
        tenant_found = False
        for tenant in data:
            if tenant["id"] == test_tenant.id:
                tenant_found = True
                assert tenant["name"] == test_tenant.name
                break
        assert tenant_found

    @pytest.mark.tenant
    async def test_get_tenants_by_pg(self, async_client: AsyncClient, auth_headers, test_tenant, test_pg):
        """Test getting tenants filtered by PG."""
        response = await async_client.get(f"/tenants/?pg_id={test_pg.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # All tenants should belong to the specified PG
        for tenant in data:
            if tenant["id"] == test_tenant.id:
                assert tenant["bed"]["room"]["pg_id"] == test_pg.id

    @pytest.mark.tenant
    async def test_get_tenant_by_id(self, async_client: AsyncClient, auth_headers, test_tenant):
        """Test getting tenant by ID."""
        response = await async_client.get(f"/tenants/{test_tenant.id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_tenant.id
        assert data["name"] == test_tenant.name
        assert data["phone"] == test_tenant.phone

    @pytest.mark.tenant
    async def test_update_tenant(self, async_client: AsyncClient, auth_headers, test_tenant):
        """Test updating tenant information."""
        update_data = {
            "name": "Updated Tenant Name",
            "phone": "9999999999",
            "email": "updated@example.com",
            "emergency_contact_name": "Updated Emergency Contact",
            "emergency_contact_phone": "8888888888"
        }

        response = await async_client.put(f"/tenants/{test_tenant.id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["phone"] == update_data["phone"]
        assert data["email"] == update_data["email"]

    @pytest.mark.tenant
    async def test_delete_tenant(self, async_client: AsyncClient, auth_headers, test_tenant, test_bed, db_session):
        """Test deleting tenant."""
        response = await async_client.delete(f"/tenants/{test_tenant.id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify tenant is deleted
        response = await async_client.get(f"/tenants/{test_tenant.id}", headers=auth_headers)
        assert response.status_code == 404

        # Verify bed is freed
        db_session.refresh(test_bed)
        assert test_bed.is_occupied is False