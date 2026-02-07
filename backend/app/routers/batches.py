"""
Batches router - CRUD operations for batch management
OPTIMIZED: Using JOIN queries instead of separate queries
UPDATED: Support supplier_id per batch (multi-supplier per container)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Batch, Container, Variety, Supplier

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_batch(
    batch_data: dict,
    db: Session = Depends(get_db)
):
    """Create a new batch - UPDATED to use supplier_id from request"""
    
    container_id = batch_data.get('container_id')
    variety_id = batch_data.get('variety_id')
    quantity = batch_data.get('quantity')
    batch_number = batch_data.get('batch_number')
    supplier_id = batch_data.get('supplier_id')  # NEW: Get supplier_id from request
    
    # Check if container exists
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    # Check if variety exists
    variety = db.query(Variety).filter(Variety.id == variety_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="Variety not found")
    
    # UPDATED: Use supplier_id from request, fallback to container's supplier
    if supplier_id:
        # Validate supplier exists
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        final_supplier_id = supplier_id
    else:
        # Fallback to container's supplier for backward compatibility
        final_supplier_id = container.supplier_id
    
    # Generate batch number if not provided
    if not batch_number:
        today = datetime.now().strftime("%Y%m%d")
        count = db.query(func.count(Batch.id)).filter(Batch.batch_number.like(f"BATCH-{today}-%")).scalar()
        batch_number = f"BATCH-{today}-{count+1:03d}"
    
    # Create batch with correct supplier_id
    db_batch = Batch(
        batch_number=batch_number,
        container_id=container_id,
        variety_id=variety_id,
        supplier_id=final_supplier_id,  # UPDATED: Use supplier from request
        quantity_expected=quantity,
        quantity_actual=quantity,
        date_received=datetime.now().date(),
        date_a1_entry=datetime.now().date(),
        current_phase='A1',
        qty_a1_start=quantity,
        qty_a1_current=quantity,
        estimated_a2_date=datetime.now().date() + timedelta(days=90),
        estimated_a3_date=datetime.now().date() + timedelta(days=180),
        estimated_a4_date=datetime.now().date() + timedelta(days=270),
        estimated_a5_date=datetime.now().date() + timedelta(days=360)
    )
    
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    
    return {"id": db_batch.id, "batch_number": db_batch.batch_number, "message": "Batch created successfully"}


@router.get("/")
async def get_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    phase: Optional[str] = Query(None),
    variety_id: Optional[int] = Query(None),
    container_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all batches - OPTIMIZED with single JOIN query
    """
    
    # Single query with all JOINs
    query = db.query(
        Batch.id,
        Batch.batch_number,
        Batch.variety_id,
        Batch.container_id,
        Batch.supplier_id,
        Batch.current_phase,
        Batch.quantity_expected,
        Batch.quantity_actual,
        Batch.qty_a1_start,
        Batch.qty_a1_current,
        Batch.qty_a2_start,
        Batch.qty_a2_current,
        Batch.qty_a3_start,
        Batch.qty_a3_current,
        Batch.qty_a4_start,
        Batch.qty_a4_current,
        Batch.qty_a5_sold,
        Batch.date_received,
        Batch.is_completed,
        Batch.created_at,
        Variety.variety_name,
        Variety.variety_code,
        Container.container_number,
        Supplier.supplier_name
    ).outerjoin(
        Variety, Batch.variety_id == Variety.id
    ).outerjoin(
        Container, Batch.container_id == Container.id
    ).outerjoin(
        Supplier, Batch.supplier_id == Supplier.id
    )
    
    # Apply filters
    if phase:
        query = query.filter(Batch.current_phase == phase.upper())
    if variety_id:
        query = query.filter(Batch.variety_id == variety_id)
    if container_id:
        query = query.filter(Batch.container_id == container_id)
    if supplier_id:
        query = query.filter(Batch.supplier_id == supplier_id)
    if search:
        query = query.filter(Batch.batch_number.ilike(f"%{search}%"))
    
    # Get total count
    total = query.count()
    
    # Apply ordering and pagination
    batches = query.order_by(Batch.created_at.desc()).offset(skip).limit(limit).all()
    
    # Build response
    result = []
    for b in batches:
        # Calculate current quantity based on phase
        current_qty = 0
        if b.current_phase == 'A1':
            current_qty = b.qty_a1_current or 0
        elif b.current_phase == 'A2':
            current_qty = b.qty_a2_current or 0
        elif b.current_phase == 'A3':
            current_qty = b.qty_a3_current or 0
        elif b.current_phase == 'A4':
            current_qty = b.qty_a4_current or 0
        elif b.current_phase == 'A5':
            current_qty = b.qty_a5_sold or 0
        
        result.append({
            "id": b.id,
            "batch_number": b.batch_number,
            "variety_id": b.variety_id,
            "variety_name": b.variety_name or "Unknown",
            "variety_code": b.variety_code or "",
            "container_id": b.container_id,
            "container_number": b.container_number or "Unknown",
            "supplier_id": b.supplier_id,
            "supplier_name": b.supplier_name or "Unknown",
            "current_phase": b.current_phase,
            "quantity_expected": b.quantity_expected,
            "quantity_actual": b.quantity_actual,
            "current_quantity": current_qty,
            "date_received": str(b.date_received) if b.date_received else None,
            "is_completed": b.is_completed,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    
    return {
        "data": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{batch_id}")
async def get_batch(
    batch_id: int,
    db: Session = Depends(get_db)
):
    """Get batch by ID - OPTIMIZED with eager loading"""
    
    # Single query with JOINs
    result = db.query(
        Batch,
        Variety.variety_name,
        Variety.variety_code,
        Variety.grade,
        Container.container_number,
        Container.arrival_date,
        Supplier.supplier_name,
        Supplier.supplier_code
    ).outerjoin(
        Variety, Batch.variety_id == Variety.id
    ).outerjoin(
        Container, Batch.container_id == Container.id
    ).outerjoin(
        Supplier, Batch.supplier_id == Supplier.id
    ).filter(
        Batch.id == batch_id
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch = result[0]
    variety_name = result[1]
    variety_code = result[2]
    variety_grade = result[3]
    container_number = result[4]
    container_arrival = result[5]
    supplier_name = result[6]
    supplier_code = result[7]
    
    # Calculate losses
    total_loss = (batch.quantity_actual or 0) - (
        (batch.qty_a1_current or 0) + 
        (batch.qty_a2_current or 0) + 
        (batch.qty_a3_current or 0) + 
        (batch.qty_a4_current or 0) +
        (batch.qty_a5_sold or 0)
    )
    
    return {
        "id": batch.id,
        "batch_number": batch.batch_number,
        "variety": {
            "id": batch.variety_id,
            "code": variety_code or "",
            "name": variety_name or "Unknown",
            "grade": variety_grade or ""
        },
        "container": {
            "id": batch.container_id,
            "number": container_number or "Unknown",
            "arrival_date": str(container_arrival) if container_arrival else None
        },
        "supplier": {
            "id": batch.supplier_id,
            "code": supplier_code or "",
            "name": supplier_name or "Unknown"
        },
        "current_phase": batch.current_phase,
        "is_completed": batch.is_completed,
        "quantities": {
            "expected": batch.quantity_expected,
            "actual": batch.quantity_actual,
            "initial_loss": batch.initial_loss or 0,
            "total_loss": total_loss if total_loss > 0 else 0
        },
        "phase_quantities": {
            "a1_start": batch.qty_a1_start,
            "a1_current": batch.qty_a1_current,
            "a2_start": batch.qty_a2_start,
            "a2_current": batch.qty_a2_current,
            "a3_start": batch.qty_a3_start,
            "a3_current": batch.qty_a3_current,
            "a4_start": batch.qty_a4_start,
            "a4_current": batch.qty_a4_current,
            "a5_sold": batch.qty_a5_sold
        },
        "dates": {
            "received": str(batch.date_received) if batch.date_received else None,
            "a1_entry": str(batch.date_a1_entry) if batch.date_a1_entry else None,
            "a2_entry": str(batch.date_a2_entry) if batch.date_a2_entry else None,
            "a3_entry": str(batch.date_a3_entry) if batch.date_a3_entry else None,
            "a4_entry": str(batch.date_a4_entry) if batch.date_a4_entry else None
        },
        "estimated_dates": {
            "a2": str(batch.estimated_a2_date) if batch.estimated_a2_date else None,
            "a3": str(batch.estimated_a3_date) if batch.estimated_a3_date else None,
            "a4": str(batch.estimated_a4_date) if batch.estimated_a4_date else None,
            "a5": str(batch.estimated_a5_date) if batch.estimated_a5_date else None
        },
        "created_at": batch.created_at.isoformat() if batch.created_at else None
    }
