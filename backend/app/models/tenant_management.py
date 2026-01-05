from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    pg_id = Column(Integer, ForeignKey("pgs.id"))
    bed_id = Column(Integer, ForeignKey("beds.id"), unique=True)
    
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String)
    id_proof = Column(String)
    
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=True)
    status = Column(String, default="active") # active, checked_out
    security_deposit = Column(Float, default=0.0)
    
    pg = relationship("PG", back_populates="tenants")
    bed = relationship("Bed", back_populates="tenant")
    rent_records = relationship("RentRecord", back_populates="tenant")


class RentRecord(Base):
    __tablename__ = "rent_records"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    pg_id = Column(Integer, ForeignKey("pgs.id"))
    
    month = Column(Date, nullable=False) # First day of the month
    amount_due = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    status = Column(String, default="pending") # pending, paid, partial
    payment_date = Column(Date, nullable=True)
    
    tenant = relationship("Tenant", back_populates="rent_records")
