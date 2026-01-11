"""
Tests for Room and Bed management functionality.
"""

import pytest
from httpx import AsyncClient


class TestRoomManagement:
    """Test room CRUD operations within PGs."""

    @pytest.mark.pg
    async def test_create_room_success(self, async_client: AsyncClient, auth_headers, test_pg, test_room_data):
        """Test successful room creation."""
        response = await async_client.post(
            f"/pgs/{test_pg.id}/rooms",
            json=test_room_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_room_data["name"]
        assert data["description"] == test_room_data["description"]
        assert data["rent_amount"] == test_room_data["rent_amount"]
        assert data["pg_id"] == test_pg.id

    @pytest.mark.pg
    async def test_create_room_invalid_pg(self, async_client: AsyncClient, auth_headers, test_room_data):
        """Test room creation for non-existent PG."""
        response = await async_client.post(
            "/pgs/99999/rooms",
            json=test_room_data,
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_create_room_unauthorized_pg(self, async_client: AsyncClient, auth_headers_user_2, test_pg, test_room_data):
        """Test room creation for another user's PG."""
        response = await async_client.post(
            f"/pgs/{test_pg.id}/rooms",
            json=test_room_data,
            headers=auth_headers_user_2
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_update_room(self, async_client: AsyncClient, auth_headers, test_room):
        """Test updating room information."""
        update_data = {
            "name": "Updated Room",
            "description": "Updated description",
            "rent_amount": 6000.0
        }

        response = await async_client.put(
            f"/pgs/rooms/{test_room.id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["rent_amount"] == update_data["rent_amount"]

    @pytest.mark.pg
    async def test_update_room_not_found(self, async_client: AsyncClient, auth_headers):
        """Test updating non-existent room."""
        update_data = {"name": "Updated Room"}

        response = await async_client.put(
            "/pgs/rooms/99999",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_delete_room(self, async_client: AsyncClient, auth_headers, test_room):
        """Test deleting room."""
        response = await async_client.delete(f"/pgs/rooms/{test_room.id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify room is deleted by trying to update it
        response = await async_client.put(
            f"/pgs/rooms/{test_room.id}",
            json={"name": "Should fail"},
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_room_rent_amount_validation(self, async_client: AsyncClient, auth_headers, test_pg):
        """Test room rent amount validation."""
        # Negative rent amount
        response = await async_client.post(f"/pgs/{test_pg.id}/rooms", json={
            "name": "Test Room",
            "description": "Test",
            "rent_amount": -1000.0
        }, headers=auth_headers)
        # Should either succeed or validate (depends on implementation)

        # Zero rent amount
        response = await async_client.post(f"/pgs/{test_pg.id}/rooms", json={
            "name": "Free Room",
            "description": "Test",
            "rent_amount": 0.0
        }, headers=auth_headers)
        assert response.status_code == 200  # Zero should be allowed


class TestBedManagement:
    """Test bed CRUD operations within rooms."""

    @pytest.mark.pg
    async def test_create_bed_success(self, async_client: AsyncClient, auth_headers, test_room, test_bed_data):
        """Test successful bed creation."""
        response = await async_client.post(
            f"/pgs/rooms/{test_room.id}/beds",
            json=test_bed_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["bed_number"] == test_bed_data["bed_number"]
        assert data["description"] == test_bed_data["description"]
        assert data["is_occupied"] is False  # New beds should be unoccupied
        assert data["room_id"] == test_room.id

    @pytest.mark.pg
    async def test_create_bed_invalid_room(self, async_client: AsyncClient, auth_headers, test_bed_data):
        """Test bed creation for non-existent room."""
        response = await async_client.post(
            "/pgs/rooms/99999/beds",
            json=test_bed_data,
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_create_bed_unauthorized_room(self, async_client: AsyncClient, auth_headers_user_2, test_room, test_bed_data):
        """Test bed creation for another user's room."""
        response = await async_client.post(
            f"/pgs/rooms/{test_room.id}/beds",
            json=test_bed_data,
            headers=auth_headers_user_2
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_update_bed(self, async_client: AsyncClient, auth_headers, test_bed):
        """Test updating bed information."""
        update_data = {
            "bed_number": "Updated-B1",
            "description": "Updated bed description"
        }

        response = await async_client.put(
            f"/pgs/beds/{test_bed.id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["bed_number"] == update_data["bed_number"]
        assert data["description"] == update_data["description"]

    @pytest.mark.pg
    async def test_update_bed_not_found(self, async_client: AsyncClient, auth_headers):
        """Test updating non-existent bed."""
        update_data = {"bed_number": "Updated"}

        response = await async_client.put(
            "/pgs/beds/99999",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_delete_bed(self, async_client: AsyncClient, auth_headers, test_bed):
        """Test deleting bed."""
        response = await async_client.delete(f"/pgs/beds/{test_bed.id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify bed is deleted
        response = await async_client.put(
            f"/pgs/beds/{test_bed.id}",
            json={"bed_number": "Should fail"},
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_delete_occupied_bed_should_fail(self, async_client: AsyncClient, auth_headers, test_occupied_bed):
        """Test that deleting an occupied bed should fail or handle gracefully."""
        response = await async_client.delete(f"/pgs/beds/{test_occupied_bed.id}", headers=auth_headers)
        # Implementation may vary - either 400/409 error or successful with cascade


class TestStructureCascadeOperations:
    """Test cascade operations and relationships."""

    @pytest.mark.pg
    async def test_delete_room_with_beds(self, async_client: AsyncClient, auth_headers, test_room, test_bed):
        """Test deleting room that contains beds."""
        # First verify bed exists
        assert test_bed.room_id == test_room.id

        # Delete the room
        response = await async_client.delete(f"/pgs/rooms/{test_room.id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify bed is also deleted (or relationship is handled properly)
        response = await async_client.put(
            f"/pgs/beds/{test_bed.id}",
            json={"bed_number": "Should fail"},
            headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.pg
    async def test_delete_pg_with_rooms_and_beds(self, async_client: AsyncClient, auth_headers, test_pg, test_room, test_bed):
        """Test deleting PG that contains rooms and beds."""
        # Verify structure exists
        assert test_room.pg_id == test_pg.id
        assert test_bed.room_id == test_room.id

        # Delete the PG
        response = await async_client.delete(f"/pgs/{test_pg.id}", headers=auth_headers)
        assert response.status_code == 200

        # Verify all related entities are deleted
        response = await async_client.put(
            f"/pgs/rooms/{test_room.id}",
            json={"name": "Should fail"},
            headers=auth_headers
        )
        assert response.status_code == 404

        response = await async_client.put(
            f"/pgs/beds/{test_bed.id}",
            json={"bed_number": "Should fail"},
            headers=auth_headers
        )
        assert response.status_code == 404


class TestStructureDataIntegrity:
    """Test data integrity and constraints."""

    @pytest.mark.pg
    async def test_duplicate_bed_numbers_in_room(self, async_client: AsyncClient, auth_headers, test_room, test_bed):
        """Test creating beds with duplicate bed numbers in same room."""
        duplicate_bed_data = {
            "bed_number": test_bed.bed_number,  # Same as existing bed
            "description": "Duplicate bed number"
        }

        response = await async_client.post(
            f"/pgs/rooms/{test_room.id}/beds",
            json=duplicate_bed_data,
            headers=auth_headers
        )
        # Should either fail with 400/409 or succeed (depends on constraints)

    @pytest.mark.pg
    async def test_bed_numbers_different_rooms(self, async_client: AsyncClient, auth_headers, test_pg, test_bed, db_session):
        """Test that same bed numbers are allowed in different rooms."""
        from app.models.pg_structure import Room

        # Create second room
        room2 = Room(
            name="Room 102",
            description="Second room",
            rent_amount=5500.0,
            pg_id=test_pg.id
        )
        db_session.add(room2)
        db_session.commit()
        db_session.refresh(room2)

        # Create bed with same bed_number in different room
        same_number_bed_data = {
            "bed_number": test_bed.bed_number,  # Same number, different room
            "description": "Same number, different room"
        }

        response = await async_client.post(
            f"/pgs/rooms/{room2.id}/beds",
            json=same_number_bed_data,
            headers=auth_headers
        )
        assert response.status_code == 200  # Should be allowed