from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class BedBase(BaseModel):
    bed_number: str
    monthly_price: float
    is_occupied: bool = False

class BedCreate(BedBase):
    pass

class BedUpdate(BaseModel):
    bed_number: Optional[str] = None
    monthly_price: Optional[float] = None
    is_occupied: Optional[bool] = None

class TenantMinimal(BaseModel):
    id: int
    name: str
    phone: str
    
    class Config:
        from_attributes = True

class Bed(BedBase):
    id: int
    room_id: int
    tenant: Optional[TenantMinimal] = None

    class Config:
        from_attributes = True


class RoomBase(BaseModel):
    room_number: str
    floor: int
    type: str

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    floor: Optional[int] = None
    type: Optional[str] = None

class Room(RoomBase):
    id: int
    pg_id: int
    beds: List[Bed] = []

    class Config:
        from_attributes = True


class PGBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None

class PGCreate(PGBase):
    pass

class PGUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None

class PG(PGBase):
    id: int
    owner_id: int
    rooms: List[Room] = []

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_pgs: int
    total_rooms: int
    total_beds: int
    occupied_beds: int
    occupancy_rate: float
    total_expected_rent: float
    total_collected_rent: float
    total_pending_rent: float
