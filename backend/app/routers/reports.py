"""
Reports router - Batch tracking and export functionality
Session 9: New router for reports
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime, date
import io

from ..database import get_db
from ..models import Batch, Container, Variety, Supplier, PhaseTransition, Greenhouse

router = APIRouter()


@router.get("/batch-tracking")
async def get_batch_tracking(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    variety_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    container_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get batch tracking report with loss at each phase transition
    Similar to the 'Batch Tracking' view in the reference image
    """
    
    # Base query
    query = db.query(
        Batch.id,
        Batch.batch_number,
        Batch.date_received,
        Batch.current_phase,
        Batch.is_completed,
        # Initial quantities
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
        # Dates
        Batch.date_a1_entry,
        Batch.date_a2_entry,
        Batch.date_a3_entry,
        Batch.date_a4_entry,
        Batch.date_a5_entry,
        # Related data
        Container.container_number,
        Variety.variety_code,
        Variety.variety_name,
        Supplier.supplier_name
    ).outerjoin(
        Container, Batch.container_id == Container.id
    ).outerjoin(
        Variety, Batch.variety_id == Variety.id
    ).outerjoin(
        Supplier, Batch.supplier_id == Supplier.id
    )
    
    # Apply filters
    if variety_id:
        query = query.filter(Batch.variety_id == variety_id)
    if supplier_id:
        query = query.filter(Batch.supplier_id == supplier_id)
    if container_id:
        query = query.filter(Batch.container_id == container_id)
    if date_from:
        try:
            date_from_parsed = datetime.strptime(date_from, "%Y-%m-%d").date()
            query = query.filter(Batch.date_received >= date_from_parsed)
        except ValueError:
            pass
    if date_to:
        try:
            date_to_parsed = datetime.strptime(date_to, "%Y-%m-%d").date()
            query = query.filter(Batch.date_received <= date_to_parsed)
        except ValueError:
            pass
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination and ordering
    batches = query.order_by(Batch.date_received.desc(), Batch.batch_number).offset(skip).limit(limit).all()
    
    # Get loss data for each batch from phase_transitions
    result = []
    
    for b in batches:
        # Get phase transitions for this batch
        transitions = db.query(PhaseTransition).filter(
            PhaseTransition.batch_id == b.id
        ).all()
        
        # Calculate loss at each transition
        loss_a1_to_a2 = 0
        loss_a2_to_a3 = 0
        loss_a3_to_a4 = 0
        loss_a4_to_a5 = 0
        loss_in_a1 = 0
        loss_in_a2 = 0
        loss_in_a3 = 0
        loss_in_a4 = 0
        
        for t in transitions:
            if t.from_phase == 'A1' and t.to_phase == 'A2':
                loss_a1_to_a2 += t.quantity_loss or 0
            elif t.from_phase == 'A2' and t.to_phase == 'A3':
                loss_a2_to_a3 += t.quantity_loss or 0
            elif t.from_phase == 'A3' and t.to_phase == 'A4':
                loss_a3_to_a4 += t.quantity_loss or 0
            elif t.from_phase == 'A4' and t.to_phase == 'A5':
                loss_a4_to_a5 += t.quantity_loss or 0
            elif t.from_phase == t.to_phase:  # In-phase loss
                if t.from_phase == 'A1':
                    loss_in_a1 += t.quantity_loss or 0
                elif t.from_phase == 'A2':
                    loss_in_a2 += t.quantity_loss or 0
                elif t.from_phase == 'A3':
                    loss_in_a3 += t.quantity_loss or 0
                elif t.from_phase == 'A4':
                    loss_in_a4 += t.quantity_loss or 0
        
        # Calculate total loss
        total_loss = loss_a1_to_a2 + loss_a2_to_a3 + loss_a3_to_a4 + loss_a4_to_a5 + loss_in_a1 + loss_in_a2 + loss_in_a3 + loss_in_a4
        
        # Get current quantity based on phase
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
        
        # Calculate survival rate
        initial_qty = b.quantity_actual or b.qty_a1_start or 0
        survival_rate = round((current_qty / initial_qty * 100), 1) if initial_qty > 0 else 0
        
        result.append({
            "id": b.id,
            "batch_number": b.batch_number,
            "container_number": b.container_number,
            "variety_code": b.variety_code,
            "variety_name": b.variety_name,
            "supplier_name": b.supplier_name,
            "date_received": str(b.date_received) if b.date_received else None,
            "current_phase": b.current_phase,
            "is_completed": b.is_completed,
            
            # Phase quantities
            "a1_start": b.qty_a1_start or 0,
            "a1_current": b.qty_a1_current or 0,
            "a2_start": b.qty_a2_start or 0,
            "a2_current": b.qty_a2_current or 0,
            "a3_start": b.qty_a3_start or 0,
            "a3_current": b.qty_a3_current or 0,
            "a4_start": b.qty_a4_start or 0,
            "a4_current": b.qty_a4_current or 0,
            "a5_sold": b.qty_a5_sold or 0,
            
            # Loss data
            "loss_a1_to_a2": loss_a1_to_a2,
            "loss_a2_to_a3": loss_a2_to_a3,
            "loss_a3_to_a4": loss_a3_to_a4,
            "loss_a4_to_a5": loss_a4_to_a5,
            "loss_in_a1": loss_in_a1,
            "loss_in_a2": loss_in_a2,
            "loss_in_a3": loss_in_a3,
            "loss_in_a4": loss_in_a4,
            "total_loss": total_loss,
            
            # Summary
            "initial_quantity": initial_qty,
            "current_quantity": current_qty,
            "survival_rate": survival_rate
        })
    
    # Calculate summary stats
    total_initial = sum(r["initial_quantity"] for r in result)
    total_current = sum(r["current_quantity"] for r in result)
    total_loss_all = sum(r["total_loss"] for r in result)
    overall_survival = round((total_current / total_initial * 100), 1) if total_initial > 0 else 0
    
    return {
        "data": result,
        "total": total_count,
        "summary": {
            "total_batches": len(result),
            "total_initial_plants": total_initial,
            "total_current_plants": total_current,
            "total_loss": total_loss_all,
            "overall_survival_rate": overall_survival
        }
    }


@router.get("/loss-summary")
async def get_loss_summary(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get summary of losses by phase"""
    
    query = db.query(PhaseTransition)
    
    # Apply date filters
    if date_from:
        try:
            date_from_parsed = datetime.strptime(date_from, "%Y-%m-%d").date()
            query = query.filter(PhaseTransition.transition_date >= date_from_parsed)
        except ValueError:
            pass
    if date_to:
        try:
            date_to_parsed = datetime.strptime(date_to, "%Y-%m-%d").date()
            query = query.filter(PhaseTransition.transition_date <= date_to_parsed)
        except ValueError:
            pass
    
    transitions = query.all()
    
    # Aggregate by transition type
    loss_by_transition = {
        "A1 → A2": 0,
        "A2 → A3": 0,
        "A3 → A4": 0,
        "A4 → A5": 0,
        "In A1": 0,
        "In A2": 0,
        "In A3": 0,
        "In A4": 0
    }
    
    loss_by_reason = {}
    
    for t in transitions:
        loss_amt = t.quantity_loss or 0
        
        if t.from_phase == 'A1' and t.to_phase == 'A2':
            loss_by_transition["A1 → A2"] += loss_amt
        elif t.from_phase == 'A2' and t.to_phase == 'A3':
            loss_by_transition["A2 → A3"] += loss_amt
        elif t.from_phase == 'A3' and t.to_phase == 'A4':
            loss_by_transition["A3 → A4"] += loss_amt
        elif t.from_phase == 'A4' and t.to_phase == 'A5':
            loss_by_transition["A4 → A5"] += loss_amt
        elif t.from_phase == t.to_phase:
            loss_by_transition[f"In {t.from_phase}"] += loss_amt
        
        # By reason
        reason = t.loss_reason or "Unknown"
        if reason not in loss_by_reason:
            loss_by_reason[reason] = 0
        loss_by_reason[reason] += loss_amt
    
    total_loss = sum(loss_by_transition.values())
    
    return {
        "total_loss": total_loss,
        "by_transition": loss_by_transition,
        "by_reason": loss_by_reason
    }


@router.get("/export/batch-tracking")
async def export_batch_tracking(
    variety_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Export batch tracking report to CSV"""
    
    # Get data using the same logic as batch-tracking endpoint
    # For simplicity, we'll create CSV directly
    
    import csv
    
    # Base query
    query = db.query(
        Batch.id,
        Batch.batch_number,
        Batch.date_received,
        Batch.current_phase,
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
        Container.container_number,
        Variety.variety_code,
        Variety.variety_name,
        Supplier.supplier_name
    ).outerjoin(
        Container, Batch.container_id == Container.id
    ).outerjoin(
        Variety, Batch.variety_id == Variety.id
    ).outerjoin(
        Supplier, Batch.supplier_id == Supplier.id
    )
    
    # Apply filters
    if variety_id:
        query = query.filter(Batch.variety_id == variety_id)
    if supplier_id:
        query = query.filter(Batch.supplier_id == supplier_id)
    if date_from:
        try:
            date_from_parsed = datetime.strptime(date_from, "%Y-%m-%d").date()
            query = query.filter(Batch.date_received >= date_from_parsed)
        except ValueError:
            pass
    if date_to:
        try:
            date_to_parsed = datetime.strptime(date_to, "%Y-%m-%d").date()
            query = query.filter(Batch.date_received <= date_to_parsed)
        except ValueError:
            pass
    
    batches = query.order_by(Batch.date_received.desc()).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "No", "Batch Number", "Container", "Variety Code", "Variety Name", 
        "Supplier", "Date Received", "Phase",
        "A1 Start", "A1 Current", "A2 Start", "A2 Current",
        "A3 Start", "A3 Current", "A4 Start", "A4 Current", "A5 Sold"
    ])
    
    # Data rows
    for idx, b in enumerate(batches, 1):
        writer.writerow([
            idx,
            b.batch_number,
            b.container_number or "",
            b.variety_code or "",
            b.variety_name or "",
            b.supplier_name or "",
            str(b.date_received) if b.date_received else "",
            b.current_phase,
            b.qty_a1_start or 0,
            b.qty_a1_current or 0,
            b.qty_a2_start or 0,
            b.qty_a2_current or 0,
            b.qty_a3_start or 0,
            b.qty_a3_current or 0,
            b.qty_a4_start or 0,
            b.qty_a4_current or 0,
            b.qty_a5_sold or 0
        ])
    
    output.seek(0)
    
    # Generate filename with date
    filename = f"batch_tracking_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
