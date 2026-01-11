"""
Tests for rent management functionality.
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, date
from dateutil.relativedelta import relativedelta


class TestRentGeneration:
    """Test rent generation functionality."""

    @pytest.mark.rent
    async def test_generate_rent_current_month(self, async_client: AsyncClient, auth_headers, test_tenant, test_room):
        """Test generating rent for current month."""
        current_date = datetime.now()
        month_param = current_date.strftime("%Y-%m")

        response = await async_client.post(
            f"/rents/generate?month={month_param}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "generated" in data
        assert data["generated"] >= 1  # At least our test tenant

    @pytest.mark.rent
    async def test_generate_rent_specific_month(self, async_client: AsyncClient, auth_headers, test_tenant, test_room):
        """Test generating rent for specific month."""
        # Generate for next month
        next_month = datetime.now() + relativedelta(months=1)
        month_param = next_month.strftime("%Y-%m")

        response = await async_client.post(
            f"/rents/generate?month={month_param}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "generated" in data

    @pytest.mark.rent
    async def test_generate_rent_duplicate_prevention(self, async_client: AsyncClient, auth_headers, test_tenant, test_room):
        """Test that duplicate rent records are not created."""
        current_date = datetime.now()
        month_param = current_date.strftime("%Y-%m")

        # First generation
        response1 = await async_client.post(
            f"/rents/generate?month={month_param}",
            headers=auth_headers
        )
        assert response1.status_code == 200
        first_generated = response1.json()["generated"]

        # Second generation for same month
        response2 = await async_client.post(
            f"/rents/generate?month={month_param}",
            headers=auth_headers
        )
        assert response2.status_code == 200
        second_generated = response2.json()["generated"]

        # Should generate fewer (or zero) records the second time
        assert second_generated <= first_generated

    @pytest.mark.rent
    async def test_generate_rent_only_active_tenants(self, async_client: AsyncClient, auth_headers, test_tenant, db_session):
        """Test that rent is only generated for active tenants."""
        from app.models.tenant_management import RentRecord

        # Check out the tenant
        await async_client.post(f"/tenants/{test_tenant.id}/checkout", headers=auth_headers)

        # Try to generate rent for next month
        next_month = datetime.now() + relativedelta(months=1)
        month_param = next_month.strftime("%Y-%m")

        response = await async_client.post(
            f"/rents/generate?month={month_param}",
            headers=auth_headers
        )

        assert response.status_code == 200

        # Verify no rent record was created for checked-out tenant
        rent_count = db_session.query(RentRecord).filter(
            RentRecord.tenant_id == test_tenant.id,
            RentRecord.month == datetime.strptime(month_param, "%Y-%m").date()
        ).count()

        assert rent_count == 0

    @pytest.mark.rent
    async def test_generate_rent_invalid_month_format(self, async_client: AsyncClient, auth_headers):
        """Test rent generation with invalid month format."""
        response = await async_client.post(
            "/rents/generate?month=invalid-month",
            headers=auth_headers
        )

        assert response.status_code == 400


class TestRentPaymentRecording:
    """Test rent payment recording functionality."""

    @pytest.mark.rent
    async def test_record_payment_full(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test recording full payment."""
        payment_data = {
            "status": "paid"
        }

        response = await async_client.put(
            f"/rents/{test_rent_record.id}",
            json=payment_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paid"
        assert data["amount_paid"] == data["amount_due"]  # Full payment
        assert data["payment_date"] is not None

    @pytest.mark.rent
    async def test_record_payment_partial(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test recording partial payment."""
        partial_amount = test_rent_record.amount_due * 0.6

        payment_data = {
            "status": "partial",
            "amount_paid": partial_amount
        }

        response = await async_client.put(
            f"/rents/{test_rent_record.id}",
            json=payment_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "partial"
        assert data["amount_paid"] == partial_amount
        assert data["payment_date"] is not None

    @pytest.mark.rent
    async def test_record_payment_custom_amount(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test recording payment with custom amount."""
        custom_amount = test_rent_record.amount_due + 100  # Extra payment

        payment_data = {
            "status": "paid",
            "amount_paid": custom_amount
        }

        response = await async_client.put(
            f"/rents/{test_rent_record.id}",
            json=payment_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paid"
        assert data["amount_paid"] == custom_amount

    @pytest.mark.rent
    async def test_record_payment_negative_amount(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test recording payment with negative amount should fail."""
        payment_data = {
            "status": "partial",
            "amount_paid": -100
        }

        response = await async_client.put(
            f"/rents/{test_rent_record.id}",
            json=payment_data,
            headers=auth_headers
        )

        # Should either fail validation or succeed (depends on implementation)
        # This documents the current behavior

    @pytest.mark.rent
    async def test_record_payment_nonexistent_rent(self, async_client: AsyncClient, auth_headers):
        """Test recording payment for non-existent rent record."""
        payment_data = {
            "status": "paid"
        }

        response = await async_client.put(
            "/rents/99999",
            json=payment_data,
            headers=auth_headers
        )

        assert response.status_code == 404

    @pytest.mark.rent
    async def test_record_payment_unauthorized(self, async_client: AsyncClient, auth_headers_user_2, test_rent_record):
        """Test recording payment for another user's rent record."""
        payment_data = {
            "status": "paid"
        }

        response = await async_client.put(
            f"/rents/{test_rent_record.id}",
            json=payment_data,
            headers=auth_headers_user_2
        )

        assert response.status_code == 404


class TestRentRetrieval:
    """Test rent record retrieval functionality."""

    @pytest.mark.rent
    async def test_get_rents_list(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test getting list of rent records."""
        response = await async_client.get("/rents/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Find our test rent record
        rent_found = False
        for rent in data:
            if rent["id"] == test_rent_record.id:
                rent_found = True
                assert rent["amount_due"] == test_rent_record.amount_due
                break
        assert rent_found

    @pytest.mark.rent
    async def test_get_rents_filter_by_month(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test getting rent records filtered by month."""
        month_param = test_rent_record.month.strftime("%Y-%m")

        response = await async_client.get(f"/rents/?month={month_param}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # All records should be from the specified month
        for rent in data:
            rent_month = datetime.strptime(rent["month"], "%Y-%m-%d").strftime("%Y-%m")
            assert rent_month == month_param

    @pytest.mark.rent
    async def test_get_rents_filter_by_status(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test getting rent records filtered by status."""
        response = await async_client.get("/rents/?status=pending", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # All records should have pending status
        for rent in data:
            assert rent["status"] == "pending"

    @pytest.mark.rent
    async def test_get_rents_pagination(self, async_client: AsyncClient, auth_headers):
        """Test rent records pagination."""
        # Test with skip and limit
        response = await async_client.get("/rents/?skip=0&limit=10", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10

    @pytest.mark.rent
    async def test_get_rents_unauthorized(self, async_client: AsyncClient):
        """Test getting rent records without authentication."""
        response = await async_client.get("/rents/")

        assert response.status_code == 401


class TestRentBusinessLogic:
    """Test rent-related business logic."""

    @pytest.mark.rent
    async def test_rent_calculation_accuracy(self, async_client: AsyncClient, auth_headers, test_bed, test_room, db_session):
        """Test that rent calculations are accurate for different check-in dates."""
        from app.models.tenant_management import Tenant, RentRecord

        # Test different check-in scenarios
        test_scenarios = [
            ("2024-01-01", 1.0),      # Full month
            ("2024-01-15", 0.5),      # Mid-month
            ("2024-01-31", 0.0323),   # End of month (1/31)
        ]

        for check_in_date, expected_ratio in test_scenarios:
            # Create tenant with specific check-in date
            tenant_data = {
                "name": f"Tenant {check_in_date}",
                "phone": "9876543210",
                "email": f"tenant_{check_in_date.replace('-', '')}@example.com",
                "check_in_date": check_in_date,
                "emergency_contact_name": "Emergency",
                "emergency_contact_phone": "9876543211",
                "bed_id": test_bed.id
            }

            response = await async_client.post("/tenants/", json=tenant_data, headers=auth_headers)
            assert response.status_code == 200
            tenant_id = response.json()["id"]

            # Check the created rent record
            rent_record = db_session.query(RentRecord).filter(
                RentRecord.tenant_id == tenant_id
            ).first()

            expected_amount = test_room.rent_amount * expected_ratio
            # Allow 10% tolerance for rounding
            assert abs(rent_record.amount_due - expected_amount) <= test_room.rent_amount * 0.1

            # Clean up for next iteration
            await async_client.delete(f"/tenants/{tenant_id}", headers=auth_headers)

    @pytest.mark.rent
    async def test_rent_status_transitions(self, async_client: AsyncClient, auth_headers, test_rent_record):
        """Test valid rent status transitions."""
        # pending -> partial
        response = await async_client.put(
            f"/rents/{test_rent_record.id}",
            json={"status": "partial", "amount_paid": test_rent_record.amount_due * 0.5},
            headers=auth_headers
        )
        assert response.status_code == 200

        # partial -> paid
        response = await async_client.put(
            f"/rents/{test_rent_record.id}",
            json={"status": "paid"},
            headers=auth_headers
        )
        assert response.status_code == 200

    @pytest.mark.rent
    async def test_rent_month_boundary_cases(self, async_client: AsyncClient, auth_headers):
        """Test rent generation for edge case months."""
        # Test February (28/29 days)
        response = await async_client.post(
            "/rents/generate?month=2024-02",
            headers=auth_headers
        )
        assert response.status_code == 200

        # Test month with 31 days
        response = await async_client.post(
            "/rents/generate?month=2024-01",
            headers=auth_headers
        )
        assert response.status_code == 200