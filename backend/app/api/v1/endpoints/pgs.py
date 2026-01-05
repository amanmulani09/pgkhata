from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.PG])
def read_pgs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve PGs owned by current user.
    """
    pgs = db.query(models.PG).filter(models.PG.owner_id == current_user.id).offset(skip).limit(limit).all()
    return pgs


@router.post("/", response_model=schemas.PG)
def create_pg(
    *,
    db: Session = Depends(deps.get_db),
    pg_in: schemas.PGCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new PG.
    """
    pg = models.PG(**pg_in.dict(), owner_id=current_user.id)
    db.add(pg)
    db.commit()
    db.refresh(pg)
    return pg


@router.get("/{pg_id}", response_model=schemas.PG)
def read_pg(
    *,
    db: Session = Depends(deps.get_db),
    pg_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get PG by ID.
    """
    pg = db.query(models.PG).filter(models.PG.id == pg_id, models.PG.owner_id == current_user.id).first()
    if not pg:
        raise HTTPException(status_code=404, detail="PG not found")
    return pg


@router.post("/{pg_id}/rooms", response_model=schemas.Room)
def create_room(
    *,
    db: Session = Depends(deps.get_db),
    pg_id: int,
    room_in: schemas.RoomCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new Room in a PG.
    """
    pg = db.query(models.PG).filter(models.PG.id == pg_id, models.PG.owner_id == current_user.id).first()
    if not pg:
        raise HTTPException(status_code=404, detail="PG not found")
    
    room = models.Room(**room_in.dict(), pg_id=pg_id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.post("/rooms/{room_id}/beds", response_model=schemas.Bed)
def create_bed(
    *,
    db: Session = Depends(deps.get_db),
    room_id: int,
    bed_in: schemas.BedCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new Bed in a Room.
    """
    room = db.query(models.Room).join(models.PG).filter(models.Room.id == room_id, models.PG.owner_id == current_user.id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    bed = models.Bed(**bed_in.dict(), room_id=room_id)
    db.add(bed)
    db.commit()
    db.refresh(bed)
    return bed
