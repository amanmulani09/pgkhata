from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class PG(Base):
    __tablename__ = "pgs"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("user.id"))
    name = Column(String, index=True, nullable=False)
    address = Column(String)
    city = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="pgs")
    rooms = relationship("Room", back_populates="pg", cascade="all, delete-orphan")
    tenants = relationship("Tenant", back_populates="pg")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    pg_id = Column(Integer, ForeignKey("pgs.id"))
    room_number = Column(String, nullable=False)
    floor = Column(Integer, default=0)
    type = Column(String)  # Single, Double, etc.

    pg = relationship("PG", back_populates="rooms")
    beds = relationship("Bed", back_populates="room", cascade="all, delete-orphan")


class Bed(Base):
    __tablename__ = "beds"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    bed_number = Column(String, nullable=False)
    is_occupied = Column(Boolean, default=False)
    monthly_price = Column(Float, default=0.0)

    room = relationship("Room", back_populates="beds")
    tenant = relationship("Tenant", back_populates="bed", uselist=False)
