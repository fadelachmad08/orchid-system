"""
Containers router - CRUD operations for container management
OPTIMIZED: Using JOIN and subquery for batch counts
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models import Container, Supplier, Batch, Variety, AgeGroup

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_container(
    container_data: dict,
    db: Session = Depends(get_db)
):
    """Create a new container"""
    
    supplier_id = container_data.get('supplier_id')
    
    # Check if supplier exists
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Create container
    db_container = Container(
        container_number=container_data.get('container_number'),
        supplier_id=supplier_id,
        arrival_date=container_data.get('arrival_date'),
        total_quantity_expected=container_data.get('total_quantity_expected'),
        total_quantity_actual=container_data.get('total_quantity_actual'),
        initial_loss=container_data.get('initial_loss'),
        status=container_data.get('status', 'active'),
        notes=container_data.get('notes')
    )
    
    db.add(db_container)
    db.commit()
    db.refresh(db_container)
    
    return {"id": db_container.id, "container_number": db_container.container_number}


@router.get("/")
async def get_containers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    supplier_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all containers - OPTIMIZED with subquery for batch stats
    """
    
    # Subquery for batch statistics per container
    batch_stats = db.query(
        Batch.container_id,
        func.count(Batch.id).label('batch_count'),
        func.coalesce(func.sum(Batch.quantity_actual), 0).label('total_plants'),
        (
            func.coalesce(func.sum(Batch.qty_a1_current), 0) +
            func.coalesce(func.sum(Batch.qty_a2_current), 0) +
            func.coalesce(func.sum(Batch.qty_a3_current), 0) +
            func.coalesce(func.sum(Batch.qty_a4_current), 0)
        ).label('current_plants')
    ).group_by(Batch.container_id).subquery()
    
    # Main query with JOIN
    query = db.query(
        Container.id,
        Container.container_number,
        Container.supplier_id,
        Container.arrival_date,
        Container.total_quantity_expected,
        Container.total_quantity_actual,
        Container.initial_loss,
        Container.status,
        Container.notes,
        Container.created_at,
        Supplier.supplier_name,
        Supplier.supplier_code,
        func.coalesce(batch_stats.c.batch_count, 0).label('batch_count'),
        func.coalesce(batch_stats.c.total_plants, 0).label('total_plants'),
        func.coalesce(batch_stats.c.current_plants, 0).label('current_plants')
    ).outerjoin(
        Supplier, Container.supplier_id == Supplier.id
    ).outerjoin(
        batch_stats, Container.id == batch_stats.c.container_id
    )
    
    # Apply filters
    if supplier_id:
        query = query.filter(Container.supplier_id == supplier_id)
    if status:
        query = query.filter(Container.status == status)
    if search:
        query = query.filter(Container.container_number.ilike(f"%{search}%"))
    
    # Get total count (before pagination)
    total = query.count()
    
    # Apply ordering and pagination
    containers = query.order_by(Container.arrival_date.desc()).offset(skip).limit(limit).all()
    
    # Build response
    result = []
    for c in containers:
        result.append({
            "id": c.id,
            "container_number": c.container_number,
            "supplier_id": c.supplier_id,
            "supplier_name": c.supplier_name or "Unknown",
            "supplier_code": c.supplier_code or "",
            "arrival_date": str(c.arrival_date) if c.arrival_date else None,
            "total_quantity_expected": c.total_quantity_expected,
            "total_quantity_actual": c.total_quantity_actual,
            "initial_loss": c.initial_loss,
            "status": c.status,
            "batch_count": c.batch_count,
            "total_plants": int(c.total_plants),
            "current_plants": int(c.current_plants),
            "notes": c.notes,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    
    return {
        "data": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{container_id}")
async def get_container(
    container_id: int,
    db: Session = Depends(get_db)
):
    """Get container by ID - OPTIMIZED with batch data in single query"""
    
    # Get container with supplier
    container = db.query(
        Container,
        Supplier.supplier_name,
        Supplier.supplier_code,
        Supplier.country
    ).outerjoin(
        Supplier, Container.supplier_id == Supplier.id
    ).filter(
        Container.id == container_id
    ).first()
    
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    c = container[0]
    supplier_name = container[1]
    supplier_code = container[2]
    supplier_country = container[3]
    
    # Get batches with variety info in single query
    batches = db.query(
        Batch.id,
        Batch.batch_number,
        Batch.variety_id,
        Batch.current_phase,
        Batch.quantity_actual,
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
        Batch.container_id == container_id
    ).order_by(Batch.batch_number).all()
    
    # Build batches data
    batches_data = []
    total_plants = 0
    current_plants = 0
    
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
        
        total_plants += b.quantity_actual or 0
        current_plants += current_qty
        
        batches_data.append({
            "id": b.id,
            "batch_number": b.batch_number,
            "variety_name": b.variety_name or "Unknown",
            "variety_code": b.variety_code or "",
            "current_phase": b.current_phase,
            "quantity_actual": b.quantity_actual,
            "current_quantity": current_qty,
            "date_received": str(b.date_received) if b.date_received else None
        })
    
    total_loss = total_plants - current_plants
    
    return {
        "id": c.id,
        "container_number": c.container_number,
        "supplier": {
            "id": c.supplier_id,
            "code": supplier_code or "",
            "name": supplier_name or "Unknown",
            "country": supplier_country or ""
        },
        "arrival_date": str(c.arrival_date) if c.arrival_date else None,
        "quantities": {
            "expected": c.total_quantity_expected,
            "actual": c.total_quantity_actual or total_plants,
            "initial_loss": c.initial_loss or 0,
            "current": current_plants,
            "total_loss": total_loss if total_loss > 0 else 0
        },
        "status": c.status,
        "notes": c.notes,
        "batch_count": len(batches),
        "batches": batches_data,
        "created_at": c.created_at.isoformat() if c.created_at else None
    }

@router.get("/{container_id}/age-groups")
async def get_container_age_groups(
    container_id: int,
    db: Session = Depends(get_db)
):
    """Get all age groups for a container with batch statistics"""
    
    # Check container exists
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    # Subquery for batch stats per age group
    batch_stats = db.query(
        Batch.age_group_id,
        func.count(Batch.id).label('batch_count'),
        func.coalesce(func.sum(Batch.quantity_actual), 0).label('total_quantity'),
        (
            func.coalesce(func.sum(Batch.qty_a1_current), 0) +
            func.coalesce(func.sum(Batch.qty_a2_current), 0) +
            func.coalesce(func.sum(Batch.qty_a3_current), 0) +
            func.coalesce(func.sum(Batch.qty_a4_current), 0)
        ).label('current_quantity')
    ).filter(
        Batch.container_id == container_id
    ).group_by(Batch.age_group_id).subquery()
    
    # Get age groups with stats
    age_groups = db.query(
        AgeGroup.id,
        AgeGroup.name,
        AgeGroup.status,
        AgeGroup.notes,
        AgeGroup.created_at,
        func.coalesce(batch_stats.c.batch_count, 0).label('batch_count'),
        func.coalesce(batch_stats.c.total_quantity, 0).label('total_quantity'),
        func.coalesce(batch_stats.c.current_quantity, 0).label('current_quantity')
    ).outerjoin(
        batch_stats, AgeGroup.id == batch_stats.c.age_group_id
    ).filter(
        AgeGroup.container_id == container_id
    ).order_by(AgeGroup.name).all()
    
    result = []
    for ag in age_groups:
        result.append({
            "id": ag.id,
            "name": ag.name,
            "status": ag.status,
            "notes": ag.notes,
            "batch_count": ag.batch_count,
            "total_quantity": int(ag.total_quantity),
            "current_quantity": int(ag.current_quantity),
            "created_at": ag.created_at.isoformat() if ag.created_at else None
        })
    
    return result


@router.put("/{container_id}")
async def update_container(
    container_id: int,
    container_data: dict,
    db: Session = Depends(get_db)
):
    """Update container"""
    container = db.query(Container).filter(Container.id == container_id).first()
    
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    for field, value in container_data.items():
        if hasattr(container, field) and value is not None:
            setattr(container, field, value)
    
    db.commit()
    db.refresh(container)
    
    return {"id": container.id, "message": "Container updated"}


@router.delete("/{container_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_container(
    container_id: int,
    db: Session = Depends(get_db)
):
    """Delete container (only if no batches)"""
    container = db.query(Container).filter(Container.id == container_id).first()
    
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    
    batch_count = db.query(func.count(Batch.id)).filter(Batch.container_id == container_id).scalar()
    if batch_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete container with {batch_count} batches")
    
    db.delete(container)
    db.commit()
    
    return None
