from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class BedBase(BaseModel):
    bed_number: str
    monthly_price: float
    is_occupied: bool = False

class BedCreate(BedBase):
    pass

class Bed(BedBase):
    id: int
    room_id: int

    class Config:
        from_attributes = True


class RoomBase(BaseModel):
    room_number: str
    floor: int
    type: str

class RoomCreate(RoomBase):
    pass

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

class PG(PGBase):
    id: int
    owner_id: int
    rooms: List[Room] = []

    class Config:
        from_attributes = True
