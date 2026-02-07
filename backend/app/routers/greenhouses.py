"""
Greenhouse router - CRUD operations for greenhouse management
Session 8: New router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from ..database import get_db
from ..models import Greenhouse, Batch, Variety

router = APIRouter()


@router.get("/")
async def get_greenhouses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    active_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get all greenhouses with batch statistics"""
    
    query = db.query(Greenhouse)
    
    if active_only:
        query = query.filter(Greenhouse.is_active == True)
    
    greenhouses = query.order_by(Greenhouse.greenhouse_name).offset(skip).limit(limit).all()
    
    result = []
    for gh in greenhouses:
        # Get batch count and plant count for this greenhouse
        batch_stats = db.query(
            func.count(Batch.id).label('batch_count'),
            func.coalesce(func.sum(Batch.qty_a1_current), 0).label('a1'),
            func.coalesce(func.sum(Batch.qty_a2_current), 0).label('a2'),
            func.coalesce(func.sum(Batch.qty_a3_current), 0).label('a3'),
            func.coalesce(func.sum(Batch.qty_a4_current), 0).label('a4'),
        ).filter(
            Batch.current_greenhouse_id == gh.id,
            Batch.is_completed == False
        ).first()
        
        current_plants = int(batch_stats.a1 or 0) + int(batch_stats.a2 or 0) + int(batch_stats.a3 or 0) + int(batch_stats.a4 or 0)
        capacity = gh.capacity or 0
        usage_percent = round((current_plants / capacity * 100), 1) if capacity > 0 else 0
        
        result.append({
            "id": gh.id,
            "greenhouse_code": gh.greenhouse_code,
            "greenhouse_name": gh.greenhouse_name,
            "location": gh.location,
            "capacity": capacity,
            "current_plants": current_plants,
            "batch_count": batch_stats.batch_count or 0,
            "usage_percent": usage_percent,
            "is_active": gh.is_active,
            "notes": gh.notes,
            "created_at": gh.created_at.isoformat() if gh.created_at else None
        })
    
    return {
        "data": result,
        "total": len(result)
    }


@router.get("/{greenhouse_id}")
async def get_greenhouse(
    greenhouse_id: int,
    db: Session = Depends(get_db)
):
    """Get greenhouse by ID with all batches"""
    
    gh = db.query(Greenhouse).filter(Greenhouse.id == greenhouse_id).first()
    
    if not gh:
        raise HTTPException(status_code=404, detail="Greenhouse not found")
    
    # Get all batches in this greenhouse
    batches = db.query(
        Batch.id,
        Batch.batch_number,
        Batch.current_phase,
        Batch.qty_a1_current,
        Batch.qty_a2_current,
        Batch.qty_a3_current,
        Batch.qty_a4_current,
        Batch.date_received,
        Variety.variety_name,
        Variety.variety_code
    ).outerjoin(
        Variety, Batch.variety_id == Variety.id
    ).filter(
        Batch.current_greenhouse_id == greenhouse_id,
        Batch.is_completed == False
    ).order_by(Batch.batch_number).all()
    
    batches_data = []
    total_plants = 0
    
    for b in batches:
        current_qty = 0
        if b.current_phase == 'A1':
            current_qty = b.qty_a1_current or 0
        elif b.current_phase == 'A2':
            current_qty = b.qty_a2_current or 0
        elif b.current_phase == 'A3':
            current_qty = b.qty_a3_current or 0
        elif b.current_phase == 'A4':
            current_qty = b.qty_a4_current or 0
        
        total_plants += current_qty
        
        batches_data.append({
            "id": b.id,
            "batch_number": b.batch_number,
            "variety_name": b.variety_name or "Unknown",
            "variety_code": b.variety_code or "",
            "current_phase": b.current_phase,
            "current_quantity": current_qty,
            "date_received": str(b.date_received) if b.date_received else None
        })
    
    capacity = gh.capacity or 0
    usage_percent = round((total_plants / capacity * 100), 1) if capacity > 0 else 0
    
    return {
        "id": gh.id,
        "greenhouse_code": gh.greenhouse_code,
        "greenhouse_name": gh.greenhouse_name,
        "location": gh.location,
        "capacity": capacity,
        "current_plants": total_plants,
        "usage_percent": usage_percent,
        "available_space": max(0, capacity - total_plants),
        "batch_count": len(batches_data),
        "batches": batches_data,
        "is_active": gh.is_active,
        "notes": gh.notes,
        "created_at": gh.created_at.isoformat() if gh.created_at else None
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_greenhouse(
    greenhouse_data: dict,
    db: Session = Depends(get_db)
):
    """Create new greenhouse"""
    
    greenhouse_code = greenhouse_data.get('greenhouse_code')
    greenhouse_name = greenhouse_data.get('greenhouse_name')
    
    if not greenhouse_code or not greenhouse_name:
        raise HTTPException(status_code=400, detail="greenhouse_code and greenhouse_name are required")
    
    # Check if code already exists
    existing = db.query(Greenhouse).filter(Greenhouse.greenhouse_code == greenhouse_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Greenhouse with code '{greenhouse_code}' already exists")
    
    gh = Greenhouse(
        greenhouse_code=greenhouse_code,
        greenhouse_name=greenhouse_name,
        location=greenhouse_data.get('location'),
        capacity=greenhouse_data.get('capacity', 0),
        notes=greenhouse_data.get('notes'),
        is_active=True
    )
    
    db.add(gh)
    db.commit()
    db.refresh(gh)
    
    return {
        "id": gh.id,
        "greenhouse_code": gh.greenhouse_code,
        "greenhouse_name": gh.greenhouse_name,
        "message": "Greenhouse created successfully"
    }


@router.put("/{greenhouse_id}")
async def update_greenhouse(
    greenhouse_id: int,
    greenhouse_data: dict,
    db: Session = Depends(get_db)
):
    """Update greenhouse"""
    
    gh = db.query(Greenhouse).filter(Greenhouse.id == greenhouse_id).first()
    
    if not gh:
        raise HTTPException(status_code=404, detail="Greenhouse not found")
    
    # Update fields
    if 'greenhouse_name' in greenhouse_data:
        gh.greenhouse_name = greenhouse_data['greenhouse_name']
    if 'location' in greenhouse_data:
        gh.location = greenhouse_data['location']
    if 'capacity' in greenhouse_data:
        gh.capacity = greenhouse_data['capacity']
    if 'notes' in greenhouse_data:
        gh.notes = greenhouse_data['notes']
    if 'is_active' in greenhouse_data:
        gh.is_active = greenhouse_data['is_active']
    
    db.commit()
    db.refresh(gh)
    
    return {
        "id": gh.id,
        "greenhouse_code": gh.greenhouse_code,
        "greenhouse_name": gh.greenhouse_name,
        "message": "Greenhouse updated successfully"
    }


@router.delete("/{greenhouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_greenhouse(
    greenhouse_id: int,
    db: Session = Depends(get_db)
):
    """Delete greenhouse (soft delete)"""
    
    gh = db.query(Greenhouse).filter(Greenhouse.id == greenhouse_id).first()
    
    if not gh:
        raise HTTPException(status_code=404, detail="Greenhouse not found")
    
    # Check if greenhouse has active batches
    batch_count = db.query(func.count(Batch.id)).filter(
        Batch.current_greenhouse_id == greenhouse_id,
        Batch.is_completed == False
    ).scalar()
    
    if batch_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete greenhouse with {batch_count} active batches. Move batches first."
        )
    
    # Soft delete
    gh.is_active = False
    db.commit()
    
    return None


@router.post("/{greenhouse_id}/assign-batch")
async def assign_batch_to_greenhouse(
    greenhouse_id: int,
    assignment_data: dict,
    db: Session = Depends(get_db)
):
    """Assign a batch to this greenhouse"""
    
    batch_id = assignment_data.get('batch_id')
    
    if not batch_id:
        raise HTTPException(status_code=400, detail="batch_id is required")
    
    # Get greenhouse
    gh = db.query(Greenhouse).filter(Greenhouse.id == greenhouse_id).first()
    if not gh:
        raise HTTPException(status_code=404, detail="Greenhouse not found")
    
    if not gh.is_active:
        raise HTTPException(status_code=400, detail="Greenhouse is inactive")
    
    # Get batch
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    old_greenhouse_id = batch.current_greenhouse_id
    
    # Assign to greenhouse
    batch.current_greenhouse_id = greenhouse_id
    db.commit()
    
    return {
        "success": True,
        "message": f"Batch {batch.batch_number} assigned to {gh.greenhouse_name}",
        "batch_id": batch_id,
        "greenhouse_id": greenhouse_id,
        "old_greenhouse_id": old_greenhouse_id
    }


@router.post("/assign-multiple")
async def assign_multiple_batches(
    assignment_data: dict,
    db: Session = Depends(get_db)
):
    """Assign multiple batches to a greenhouse"""
    
    greenhouse_id = assignment_data.get('greenhouse_id')
    batch_ids = assignment_data.get('batch_ids', [])
    
    if not greenhouse_id:
        raise HTTPException(status_code=400, detail="greenhouse_id is required")
    if not batch_ids:
        raise HTTPException(status_code=400, detail="batch_ids is required")
    
    # Get greenhouse
    gh = db.query(Greenhouse).filter(Greenhouse.id == greenhouse_id).first()
    if not gh:
        raise HTTPException(status_code=404, detail="Greenhouse not found")
    
    # Update batches
    updated = 0
    for batch_id in batch_ids:
        batch = db.query(Batch).filter(Batch.id == batch_id).first()
        if batch:
            batch.current_greenhouse_id = greenhouse_id
            updated += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"{updated} batches assigned to {gh.greenhouse_name}",
        "greenhouse_id": greenhouse_id,
        "updated_count": updated
    }


@router.get("/{greenhouse_id}/available-batches")
async def get_available_batches(
    greenhouse_id: int,
    db: Session = Depends(get_db)
):
    """Get batches that are not assigned to this greenhouse (including unassigned batches)"""
    
    from sqlalchemy import or_
    
    batches = db.query(
        Batch.id,
        Batch.batch_number,
        Batch.current_phase,
        Batch.qty_a1_current,
        Batch.qty_a2_current,
        Batch.qty_a3_current,
        Batch.qty_a4_current,
        Batch.current_greenhouse_id,
        Variety.variety_name,
        Variety.variety_code,
        Greenhouse.greenhouse_name
    ).outerjoin(
        Variety, Batch.variety_id == Variety.id
    ).outerjoin(
        Greenhouse, Batch.current_greenhouse_id == Greenhouse.id
    ).filter(
        Batch.is_completed == False,
        or_(
            Batch.current_greenhouse_id == None,  # Unassigned batches
            Batch.current_greenhouse_id != greenhouse_id  # Batches in other greenhouses
        )
    ).order_by(Batch.batch_number).all()
    
    result = []
    for b in batches:
        current_qty = 0
        if b.current_phase == 'A1':
            current_qty = b.qty_a1_current or 0
        elif b.current_phase == 'A2':
            current_qty = b.qty_a2_current or 0
        elif b.current_phase == 'A3':
            current_qty = b.qty_a3_current or 0
        elif b.current_phase == 'A4':
            current_qty = b.qty_a4_current or 0
        
        result.append({
            "id": b.id,
            "batch_number": b.batch_number,
            "variety_name": b.variety_name or "Unknown",
            "variety_code": b.variety_code or "",
            "current_phase": b.current_phase,
            "current_quantity": current_qty,
            "current_greenhouse_id": b.current_greenhouse_id,
            "current_greenhouse_name": b.greenhouse_name
        })
    
    return {
        "data": result,
        "total": len(result)
    }
