from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date

from app import models, schemas
from app.api import deps

router = APIRouter()

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
