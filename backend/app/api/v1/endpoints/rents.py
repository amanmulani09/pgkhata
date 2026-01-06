from typing import Any, List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.RentRecord])
def read_rents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    curr_month: Optional[date] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve rent records.
    """
    query = db.query(models.RentRecord).join(models.PG).filter(models.PG.owner_id == current_user.id)
    
    if curr_month:
        query = query.filter(models.RentRecord.month == curr_month)
    if status:
        query = query.filter(models.RentRecord.status == status)
        
    rents = query.offset(skip).limit(limit).all()
    return rents

@router.post("/generate")
def generate_monthly_rent(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate rent records for all active tenants for the current month.
    """
    # Logic: Find active tenants, check if rent record exists for this month, if not create one.
    # Current month start date
    today = date.today()
    month_start = date(today.year, today.month, 1)
    
    # Get all active tenants for this user's PGs
    tenants = db.query(models.Tenant).join(models.PG).filter(
        models.PG.owner_id == current_user.id,
        models.Tenant.status == "active"
    ).all()
    
    created_count = 0
    
    for tenant in tenants:
        # Check if rent record exists
        exists = db.query(models.RentRecord).filter(
            models.RentRecord.tenant_id == tenant.id,
            models.RentRecord.month == month_start
        ).first()
        
        if not exists:
            # Get bed price
            bed = db.query(models.Bed).filter(models.Bed.id == tenant.bed_id).first()
            amount = bed.monthly_price if bed else 0.0
            
            rent_record = models.RentRecord(
                tenant_id=tenant.id,
                pg_id=tenant.pg_id,
                month=month_start,
                amount_due=amount,
                status="pending"
            )
            db.add(rent_record)
            created_count += 1
            
    db.commit()
    return {"message": f"Generated {created_count} rent records for {month_start.strftime('%B %Y')}"}

@router.put("/{rent_id}", response_model=schemas.RentRecord)
def update_rent(
    *,
    db: Session = Depends(deps.get_db),
    rent_id: int,
    rent_in: schemas.RentRecordUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update rent record (e.g. mark as paid).
    """
    rent = db.query(models.RentRecord).join(models.PG).filter(
        models.RentRecord.id == rent_id, 
        models.PG.owner_id == current_user.id
    ).first()

    if not rent:
        raise HTTPException(status_code=404, detail="Rent record not found")
        
    update_data = rent_in.dict(exclude_unset=True)
    
    # Auto-fill amount_paid if status is 'paid' and amount_paid isn't specified
    if update_data.get("status") == "paid" and "amount_paid" not in update_data:
        update_data["amount_paid"] = rent.amount_due

    for field, value in update_data.items():
        setattr(rent, field, value)
        
    db.add(rent)
    db.commit()
    db.refresh(rent)
    return rent
