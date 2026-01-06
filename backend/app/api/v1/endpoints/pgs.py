from typing import Any, List, Optional
from datetime import date

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


@router.get("/stats", response_model=schemas.DashboardStats)
def read_dashboard_stats(
    db: Session = Depends(deps.get_db),
    curr_month: Optional[date] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get statistics for the dashboard.
    """
    if not curr_month:
        today = date.today()
        curr_month = date(today.year, today.month, 1)

    # Get all user's PGs
    pg_ids = [pg.id for pg in db.query(models.PG.id).filter(models.PG.owner_id == current_user.id).all()]
    
    total_pgs = len(pg_ids)
    
    if total_pgs == 0:
        return schemas.DashboardStats(
            total_pgs=0, total_rooms=0, total_beds=0, occupied_beds=0, 
            occupancy_rate=0.0, total_expected_rent=0.0, 
            total_collected_rent=0.0, total_pending_rent=0.0
        )

    # Room count
    total_rooms = db.query(models.Room).filter(models.Room.pg_id.in_(pg_ids)).count()
    
    # Bed count and occupancy
    beds = db.query(models.Bed).join(models.Room).filter(models.Room.pg_id.in_(pg_ids)).all()
    total_beds = len(beds)
    occupied_beds = sum(1 for b in beds if b.is_occupied)
    occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0.0
    
    # Rent stats for specific month
    rents = db.query(models.RentRecord).filter(
        models.RentRecord.pg_id.in_(pg_ids),
        models.RentRecord.month == curr_month
    ).all()
    
    total_expected_rent = float(sum(r.amount_due or 0.0 for r in rents))
    # Support legacy entries where status is paid but amount_paid wasn't set, and future partial payments
    total_collected_rent = float(sum(
        (r.amount_paid if r.amount_paid and r.amount_paid > 0 else r.amount_due) 
        if r.status == "paid" else (r.amount_paid or 0.0) 
        for r in rents
    ))
    total_pending_rent = total_expected_rent - total_collected_rent
    
    return schemas.DashboardStats(
        total_pgs=int(total_pgs),
        total_rooms=int(total_rooms),
        total_beds=int(total_beds),
        occupied_beds=int(occupied_beds),
        occupancy_rate=float(occupancy_rate),
        total_expected_rent=total_expected_rent,
        total_collected_rent=total_collected_rent,
        total_pending_rent=total_pending_rent
    )

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


@router.put("/{pg_id}", response_model=schemas.PG)
def update_pg(
    *,
    db: Session = Depends(deps.get_db),
    pg_id: int,
    pg_in: schemas.PGUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a PG.
    """
    pg = db.query(models.PG).filter(models.PG.id == pg_id, models.PG.owner_id == current_user.id).first()
    if not pg:
        raise HTTPException(status_code=404, detail="PG not found")
    
    update_data = pg_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pg, field, value)
    
    db.add(pg)
    db.commit()
    db.refresh(pg)
    return pg


@router.delete("/{pg_id}", response_model=schemas.PG)
def delete_pg(
    *,
    db: Session = Depends(deps.get_db),
    pg_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a PG.
    """
    pg = db.query(models.PG).filter(models.PG.id == pg_id, models.PG.owner_id == current_user.id).first()
    if not pg:
        raise HTTPException(status_code=404, detail="PG not found")
    
    db.delete(pg)
    db.commit()
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


@router.put("/rooms/{room_id}", response_model=schemas.Room)
def update_room(
    *,
    db: Session = Depends(deps.get_db),
    room_id: int,
    room_in: schemas.RoomUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a Room.
    """
    room = db.query(models.Room).join(models.PG).filter(models.Room.id == room_id, models.PG.owner_id == current_user.id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    update_data = room_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(room, field, value)
    
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.delete("/rooms/{room_id}", response_model=schemas.Room)
def delete_room(
    *,
    db: Session = Depends(deps.get_db),
    room_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a Room.
    """
    room = db.query(models.Room).join(models.PG).filter(models.Room.id == room_id, models.PG.owner_id == current_user.id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db.delete(room)
    db.commit()
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


@router.put("/beds/{bed_id}", response_model=schemas.Bed)
def update_bed(
    *,
    db: Session = Depends(deps.get_db),
    bed_id: int,
    bed_in: schemas.BedUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a Bed.
    """
    bed = db.query(models.Bed).join(models.Room).join(models.PG).filter(models.Bed.id == bed_id, models.PG.owner_id == current_user.id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    update_data = bed_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bed, field, value)
    
    db.add(bed)
    db.commit()
    db.refresh(bed)
    return bed


@router.delete("/beds/{bed_id}", response_model=schemas.Bed)
def delete_bed(
    *,
    db: Session = Depends(deps.get_db),
    bed_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a Bed.
    """
    bed = db.query(models.Bed).join(models.Room).join(models.PG).filter(models.Bed.id == bed_id, models.PG.owner_id == current_user.id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    db.delete(bed)
    db.commit()
    return bed

    db.delete(bed)
    db.commit()
    return bed
