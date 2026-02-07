"""
Phase Transitions router - Handle phase movements A1→A2→A3→A4→A5
Session 7: New router for phase management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, date

from ..database import get_db
from ..models import Batch, PhaseTransition, Variety
from ..auth import get_current_user

router = APIRouter()

# Valid phase transitions
VALID_TRANSITIONS = {
    'A1': 'A2',
    'A2': 'A3',
    'A3': 'A4',
    'A4': 'A5'
}

PHASE_DESCRIPTIONS = {
    'A1': 'Quarantine',
    'A2': 'Repotting 1',
    'A3': 'Repotting 2', 
    'A4': 'Highland',
    'A5': 'Sales'
}


@router.post("/move")
async def move_phase(
    transition_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Move batch to next phase
    
    Required fields:
    - batch_id: int
    - quantity_loss: int (reject/dead count)
    - transition_date: str (YYYY-MM-DD)
    
    Optional:
    - loss_reason: str (disease, damage, dead, weak, other)
    - loss_notes: str
    - notes: str
    """
    
    batch_id = transition_data.get('batch_id')
    quantity_loss = transition_data.get('quantity_loss', 0)
    transition_date_str = transition_data.get('transition_date')
    loss_reason = transition_data.get('loss_reason')
    loss_notes = transition_data.get('loss_notes')
    notes = transition_data.get('notes')
    
    # Validate required fields
    if not batch_id:
        raise HTTPException(status_code=400, detail="batch_id is required")
    if not transition_date_str:
        raise HTTPException(status_code=400, detail="transition_date is required")
    
    # Parse date
    try:
        transition_date = datetime.strptime(transition_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get batch
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Check if batch is already completed
    if batch.is_completed:
        raise HTTPException(status_code=400, detail="Batch is already completed (A5)")
    
    # Get current phase and validate transition
    current_phase = batch.current_phase
    if current_phase not in VALID_TRANSITIONS:
        raise HTTPException(status_code=400, detail=f"Cannot move from phase {current_phase}")
    
    next_phase = VALID_TRANSITIONS[current_phase]
    
    # Get current quantity
    current_qty = 0
    if current_phase == 'A1':
        current_qty = batch.qty_a1_current or 0
    elif current_phase == 'A2':
        current_qty = batch.qty_a2_current or 0
    elif current_phase == 'A3':
        current_qty = batch.qty_a3_current or 0
    elif current_phase == 'A4':
        current_qty = batch.qty_a4_current or 0
    
    # Validate quantity_loss
    if quantity_loss < 0:
        raise HTTPException(status_code=400, detail="quantity_loss cannot be negative")
    if quantity_loss > current_qty:
        raise HTTPException(status_code=400, detail=f"quantity_loss ({quantity_loss}) cannot exceed current quantity ({current_qty})")
    
    # Calculate quantity to move
    quantity_moved = current_qty - quantity_loss
    
    if quantity_moved < 0:
        raise HTTPException(status_code=400, detail="Quantity to move cannot be negative")
    
    # Create transition record
    transition = PhaseTransition(
        batch_id=batch_id,
        from_phase=current_phase,
        to_phase=next_phase,
        quantity_before=current_qty,
        quantity_moved=quantity_moved,
        quantity_loss=quantity_loss,
        loss_reason=loss_reason,
        loss_notes=loss_notes,
        transition_date=transition_date,
        notes=notes
    )
    
    db.add(transition)
    
    # Update batch quantities
    if current_phase == 'A1':
        batch.qty_a1_current = 0  # All moved out
    elif current_phase == 'A2':
        batch.qty_a2_current = 0
    elif current_phase == 'A3':
        batch.qty_a3_current = 0
    elif current_phase == 'A4':
        batch.qty_a4_current = 0
    
    # Set next phase quantities
    if next_phase == 'A2':
        batch.qty_a2_start = quantity_moved
        batch.qty_a2_current = quantity_moved
        batch.date_a2_entry = transition_date
    elif next_phase == 'A3':
        batch.qty_a3_start = quantity_moved
        batch.qty_a3_current = quantity_moved
        batch.date_a3_entry = transition_date
    elif next_phase == 'A4':
        batch.qty_a4_start = quantity_moved
        batch.qty_a4_current = quantity_moved
        batch.date_a4_entry = transition_date
    elif next_phase == 'A5':
        batch.qty_a5_sold = quantity_moved
        batch.date_a5_entry = transition_date
        batch.is_completed = True
    
    # Update current phase
    batch.current_phase = next_phase
    
    db.commit()
    db.refresh(batch)
    db.refresh(transition)
    
    return {
        "success": True,
        "message": f"Batch moved from {current_phase} to {next_phase}",
        "transition": {
            "id": transition.id,
            "from_phase": current_phase,
            "to_phase": next_phase,
            "quantity_before": current_qty,
            "quantity_moved": quantity_moved,
            "quantity_loss": quantity_loss,
            "transition_date": str(transition_date)
        },
        "batch": {
            "id": batch.id,
            "batch_number": batch.batch_number,
            "current_phase": batch.current_phase,
            "is_completed": batch.is_completed
        }
    }


@router.post("/record-loss")
async def record_in_phase_loss(
    loss_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Record loss within current phase (not during transition)
    For plants that die/get damaged during a phase
    
    Required fields:
    - batch_id: int
    - quantity_loss: int
    - loss_date: str (YYYY-MM-DD)
    
    Optional:
    - loss_reason: str
    - loss_notes: str
    """
    
    batch_id = loss_data.get('batch_id')
    quantity_loss = loss_data.get('quantity_loss', 0)
    loss_date_str = loss_data.get('loss_date')
    loss_reason = loss_data.get('loss_reason')
    loss_notes = loss_data.get('loss_notes')
    
    if not batch_id:
        raise HTTPException(status_code=400, detail="batch_id is required")
    if not loss_date_str:
        raise HTTPException(status_code=400, detail="loss_date is required")
    if quantity_loss <= 0:
        raise HTTPException(status_code=400, detail="quantity_loss must be greater than 0")
    
    # Parse date
    try:
        loss_date = datetime.strptime(loss_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get batch
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    current_phase = batch.current_phase
    
    # Get current quantity
    current_qty = 0
    if current_phase == 'A1':
        current_qty = batch.qty_a1_current or 0
    elif current_phase == 'A2':
        current_qty = batch.qty_a2_current or 0
    elif current_phase == 'A3':
        current_qty = batch.qty_a3_current or 0
    elif current_phase == 'A4':
        current_qty = batch.qty_a4_current or 0
    
    if quantity_loss > current_qty:
        raise HTTPException(status_code=400, detail=f"quantity_loss ({quantity_loss}) exceeds current quantity ({current_qty})")
    
    # Create loss record (same phase transition)
    loss_record = PhaseTransition(
        batch_id=batch_id,
        from_phase=current_phase,
        to_phase=current_phase,  # Same phase = in-phase loss
        quantity_before=current_qty,
        quantity_moved=current_qty - quantity_loss,
        quantity_loss=quantity_loss,
        loss_reason=loss_reason,
        loss_notes=loss_notes,
        transition_date=loss_date,
        notes=f"In-phase loss during {current_phase}"
    )
    
    db.add(loss_record)
    
    # Update current quantity
    new_qty = current_qty - quantity_loss
    if current_phase == 'A1':
        batch.qty_a1_current = new_qty
    elif current_phase == 'A2':
        batch.qty_a2_current = new_qty
    elif current_phase == 'A3':
        batch.qty_a3_current = new_qty
    elif current_phase == 'A4':
        batch.qty_a4_current = new_qty
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Recorded loss of {quantity_loss} plants in phase {current_phase}",
        "batch": {
            "id": batch.id,
            "batch_number": batch.batch_number,
            "current_phase": current_phase,
            "quantity_before": current_qty,
            "quantity_after": new_qty
        }
    }


@router.get("/history/{batch_id}")
async def get_transition_history(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all phase transitions for a batch"""
    
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    transitions = db.query(PhaseTransition).filter(
        PhaseTransition.batch_id == batch_id
    ).order_by(PhaseTransition.transition_date.desc()).all()
    
    history = []
    for t in transitions:
        is_phase_move = t.from_phase != t.to_phase
        history.append({
            "id": t.id,
            "type": "phase_move" if is_phase_move else "in_phase_loss",
            "from_phase": t.from_phase,
            "to_phase": t.to_phase,
            "from_phase_name": PHASE_DESCRIPTIONS.get(t.from_phase, t.from_phase),
            "to_phase_name": PHASE_DESCRIPTIONS.get(t.to_phase, t.to_phase),
            "quantity_before": t.quantity_before,
            "quantity_moved": t.quantity_moved,
            "quantity_loss": t.quantity_loss,
            "loss_reason": t.loss_reason,
            "loss_notes": t.loss_notes,
            "transition_date": str(t.transition_date) if t.transition_date else None,
            "notes": t.notes,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
    
    # Calculate totals
    total_loss = sum(t.quantity_loss for t in transitions)
    phase_moves = [t for t in transitions if t.from_phase != t.to_phase]
    in_phase_losses = [t for t in transitions if t.from_phase == t.to_phase]
    
    return {
        "batch_id": batch_id,
        "batch_number": batch.batch_number,
        "current_phase": batch.current_phase,
        "summary": {
            "total_transitions": len(phase_moves),
            "total_in_phase_losses": len(in_phase_losses),
            "total_quantity_lost": total_loss,
            "starting_quantity": batch.quantity_actual,
            "current_quantity": _get_current_qty(batch)
        },
        "history": history
    }


@router.get("/batches-ready")
async def get_batches_ready_for_transition(
    phase: Optional[str] = Query(None, description="Filter by current phase"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get batches that are ready for phase transition (have quantity > 0)"""
    
    query = db.query(
        Batch.id,
        Batch.batch_number,
        Batch.current_phase,
        Batch.qty_a1_current,
        Batch.qty_a2_current,
        Batch.qty_a3_current,
        Batch.qty_a4_current,
        Batch.is_completed,
        Variety.variety_name,
        Variety.variety_code
    ).outerjoin(
        Variety, Batch.variety_id == Variety.id
    ).filter(
        Batch.is_completed == False
    )
    
    if phase:
        query = query.filter(Batch.current_phase == phase.upper())
    
    batches = query.order_by(Batch.batch_number).all()
    
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
        
        if current_qty > 0:  # Only include batches with plants
            next_phase = VALID_TRANSITIONS.get(b.current_phase)
            result.append({
                "id": b.id,
                "batch_number": b.batch_number,
                "variety_name": b.variety_name or "Unknown",
                "variety_code": b.variety_code or "",
                "current_phase": b.current_phase,
                "current_phase_name": PHASE_DESCRIPTIONS.get(b.current_phase, b.current_phase),
                "next_phase": next_phase,
                "next_phase_name": PHASE_DESCRIPTIONS.get(next_phase, next_phase) if next_phase else None,
                "current_quantity": current_qty,
                "can_move": next_phase is not None
            })
    
    return {
        "data": result,
        "total": len(result)
    }


def _get_current_qty(batch: Batch) -> int:
    """Helper to get current quantity based on phase"""
    if batch.current_phase == 'A1':
        return batch.qty_a1_current or 0
    elif batch.current_phase == 'A2':
        return batch.qty_a2_current or 0
    elif batch.current_phase == 'A3':
        return batch.qty_a3_current or 0
    elif batch.current_phase == 'A4':
        return batch.qty_a4_current or 0
    elif batch.current_phase == 'A5':
        return batch.qty_a5_sold or 0
    return 0
