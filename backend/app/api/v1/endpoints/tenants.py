from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta
import calendar

from app import models, schemas
from app.api import deps

router = APIRouter()


def calculate_prorated_rent(check_in_date: date, monthly_rent: float) -> float:
    """
    Calculate prorated rent for partial month based on check-in date.
    Args:
        check_in_date: The date tenant checks in
        monthly_rent: The full monthly rent amount
    Returns:
        Prorated rent amount for the remaining days in the month
    """
    # Get total days in the month
    year = check_in_date.year
    month = check_in_date.month
    total_days = calendar.monthrange(year, month)[1]

    # Calculate remaining days (including check-in day)
    remaining_days = total_days - check_in_date.day + 1

    # Calculate prorated amount
    daily_rate = monthly_rent / total_days
    prorated_amount = daily_rate * remaining_days

    return round(prorated_amount, 2)

@router.get("/", response_model=List[schemas.Tenant])
def read_tenants(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    pg_id: Optional[int] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve tenants.
    """
    query = db.query(models.Tenant).join(models.PG).filter(models.PG.owner_id == current_user.id)
    if pg_id:
        query = query.filter(models.Tenant.pg_id == pg_id)
    
    tenants = query.offset(skip).limit(limit).all()
    return tenants


@router.get("/{tenant_id}", response_model=schemas.Tenant)
def read_tenant(
    *,
    db: Session = Depends(deps.get_db),
    tenant_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get tenant by ID.
    """
    tenant = db.query(models.Tenant).join(models.PG).filter(
        models.Tenant.id == tenant_id, 
        models.PG.owner_id == current_user.id
    ).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.post("/", response_model=schemas.Tenant)
def create_tenant(
    *,
    db: Session = Depends(deps.get_db),
    tenant_in: schemas.TenantCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new Tenant.
    """
    # Verify Bed exists and belongs to User's PG
    bed = db.query(models.Bed).join(models.Room).join(models.PG).filter(
        models.Bed.id == tenant_in.bed_id, 
        models.PG.owner_id == current_user.id
    ).first()
    
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    if bed.is_occupied:
         raise HTTPException(status_code=400, detail="Bed is already occupied")

    # Verify PG ownership (implicit via bed check, but good to be explicit if pg_id passed)
    # Get PG ID from Bed's hierarchy
    pg_id = bed.room.pg_id
    
    tenant = models.Tenant(
        **tenant_in.dict(exclude={'bed_id', 'pg_id'}),
        bed_id=tenant_in.bed_id,
        pg_id=pg_id
    )
    db.add(tenant)
    
    # Mark bed as occupied
    bed.is_occupied = True
    db.add(bed)
    
    # Explicitly flush to get tenant.id
    db.flush()

    # Auto-generate rent record for the month of check-in
    check_in = tenant.check_in_date
    month_start = date(check_in.year, check_in.month, 1)

    # Calculate prorated rent if tenant joins mid-month
    if check_in.day == 1:
        # If joining on 1st, charge full month
        first_month_amount = bed.monthly_price
    else:
        # If joining mid-month, calculate prorated amount
        first_month_amount = calculate_prorated_rent(check_in, bed.monthly_price)

    rent_record = models.RentRecord(
        tenant_id=tenant.id,
        pg_id=pg_id,
        month=month_start,
        amount_due=first_month_amount,
        status="pending"
    )
    db.add(rent_record)
    
    db.commit()
    db.refresh(tenant)
    return tenant

@router.post("/{tenant_id}/checkout", response_model=schemas.Tenant)
def checkout_tenant(
    *,
    db: Session = Depends(deps.get_db),
    tenant_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Check out a tenant.
    """
    tenant = db.query(models.Tenant).join(models.PG).filter(
        models.Tenant.id == tenant_id, 
        models.PG.owner_id == current_user.id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if tenant.status == "checked_out":
         raise HTTPException(status_code=400, detail="Tenant already checked out")
    
    tenant.check_out_date = date.today()
    tenant.status = "checked_out"
    
    # Free up the bed
    bed = db.query(models.Bed).filter(models.Bed.id == tenant.bed_id).first()
    if bed:
        bed.is_occupied = False
        db.add(bed)
        
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.put("/{tenant_id}", response_model=schemas.Tenant)
def update_tenant(
    *,
    db: Session = Depends(deps.get_db),
    tenant_id: int,
    tenant_in: schemas.TenantUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a tenant.
    """
    tenant = db.query(models.Tenant).join(models.PG).filter(
        models.Tenant.id == tenant_id, 
        models.PG.owner_id == current_user.id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    update_data = tenant_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", response_model=schemas.Tenant)
def delete_tenant(
    *,
    db: Session = Depends(deps.get_db),
    tenant_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a tenant.
    """
    tenant = db.query(models.Tenant).join(models.PG).filter(
        models.Tenant.id == tenant_id, 
        models.PG.owner_id == current_user.id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Free up the bed if the tenant was active
    if tenant.status == "active":
        bed = db.query(models.Bed).filter(models.Bed.id == tenant.bed_id).first()
        if bed:
            bed.is_occupied = False
            db.add(bed)
    
    db.delete(tenant)
    db.commit()
    return tenant
