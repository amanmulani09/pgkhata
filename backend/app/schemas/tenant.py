from datetime import date
from typing import Optional, List
from pydantic import BaseModel

# --- Rent Record Schemas ---
class RentRecordBase(BaseModel):
    month: date
    amount_due: float
    status: str = "pending"

class RentRecordCreate(RentRecordBase):
    tenant_id: Optional[int] = None

class RentRecordUpdate(BaseModel):
    status: Optional[str] = None
    amount_paid: Optional[float] = None
    payment_date: Optional[date] = None

class RentRecord(RentRecordBase):
    id: int
    tenant_id: Optional[int] = None
    pg_id: int
    amount_paid: float = 0.0
    payment_date: Optional[date] = None

    class Config:
        from_attributes = True

# --- Minimal Schemas for Relationships ---
class PGMinimal(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class RoomMinimal(BaseModel):
    id: int
    room_number: str
    floor: int
    type: str
    class Config:
        from_attributes = True

class BedMinimal(BaseModel):
    id: int
    bed_number: str
    monthly_price: float
    room: Optional[RoomMinimal] = None
    class Config:
        from_attributes = True

# --- Tenant Schemas ---
class TenantBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    id_proof: Optional[str] = None
    check_in_date: date
    security_deposit: float = 0.0
    status: str = "active"

class TenantCreate(TenantBase):
    bed_id: int  # Bed assignment is mandatory on creation for MVP
    pg_id: int # Implicitly required context, though could be inferred from bed -> room -> pg

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    check_out_date: Optional[date] = None

class Tenant(TenantBase):
    id: int
    pg_id: int
    bed_id: int
    check_out_date: Optional[date] = None
    rent_records: List[RentRecord] = []
    bed: Optional[BedMinimal] = None
    pg: Optional[PGMinimal] = None

    class Config:
        from_attributes = True
