"""
Varieties router - CRUD operations for orchid variety management
OPTIMIZED: Removed auth dependency for faster loading
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Variety
from ..schemas import VarietyCreate, VarietyUpdate, VarietyResponse

router = APIRouter()


@router.get("/", response_model=List[VarietyResponse])
async def get_varieties(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get list of all varieties"""
    query = db.query(Variety)
    
    if active_only:
        query = query.filter(Variety.is_active == True)
    
    varieties = query.offset(skip).limit(limit).all()
    return varieties


@router.get("/{variety_id}", response_model=VarietyResponse)
async def get_variety(
    variety_id: int,
    db: Session = Depends(get_db)
):
    """Get variety by ID"""
    variety = db.query(Variety).filter(Variety.id == variety_id).first()
    
    if not variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variety with ID {variety_id} not found"
        )
    
    return variety


@router.post("/", response_model=VarietyResponse, status_code=status.HTTP_201_CREATED)
async def create_variety(
    variety_data: VarietyCreate,
    db: Session = Depends(get_db)
):
    """Create new variety"""
    existing = db.query(Variety).filter(
        Variety.variety_code == variety_data.variety_code
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Variety with code {variety_data.variety_code} already exists"
        )
    
    db_variety = Variety(**variety_data.model_dump())
    
    db.add(db_variety)
    db.commit()
    db.refresh(db_variety)
    
    return db_variety


@router.put("/{variety_id}", response_model=VarietyResponse)
async def update_variety(
    variety_id: int,
    variety_data: VarietyUpdate,
    db: Session = Depends(get_db)
):
    """Update existing variety"""
    db_variety = db.query(Variety).filter(Variety.id == variety_id).first()
    
    if not db_variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variety with ID {variety_id} not found"
        )
    
    update_data = variety_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_variety, field, value)
    
    db.commit()
    db.refresh(db_variety)
    
    return db_variety


@router.delete("/{variety_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_variety(
    variety_id: int,
    db: Session = Depends(get_db)
):
    """Delete variety (soft delete)"""
    db_variety = db.query(Variety).filter(Variety.id == variety_id).first()
    
    if not db_variety:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variety with ID {variety_id} not found"
        )
    
    db_variety.is_active = False
    db.commit()
    
    return None
