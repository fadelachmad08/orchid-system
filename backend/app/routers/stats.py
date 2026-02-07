"""
Statistics router - Dashboard analytics endpoints
Session 12: Dashboard Analytics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from datetime import datetime, timedelta
from typing import List, Dict, Any

from ..database import get_db
from ..models import Batch, PhaseTransition, Greenhouse, Variety, Container, Supplier
from ..auth import get_current_user

router = APIRouter()


@router.get("/overview")
async def get_overview_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get overview statistics for dashboard cards
    Returns: total plants, active batches, greenhouses, loss rate
    """
    
    # Total plants across all phases (excluding completed batches)
    total_plants = db.query(
        func.sum(
            Batch.qty_a1_current +
            Batch.qty_a2_current +
            Batch.qty_a3_current +
            Batch.qty_a4_current
        )
    ).filter(Batch.is_completed == False).scalar() or 0
    
    # Active batches (not completed)
    active_batches = db.query(Batch).filter(Batch.is_completed == False).count()
    
    # Total greenhouses
    total_greenhouses = db.query(Greenhouse).filter(Greenhouse.is_active == True).count()
    
    # Overall loss rate
    # Sum of all initial quantities
    total_initial = db.query(func.sum(Batch.quantity_actual)).scalar() or 0
    
    # Sum of all losses (initial loss + transition losses)
    total_loss = db.query(
        func.sum(Batch.initial_loss)
    ).scalar() or 0
    
    transition_loss = db.query(
        func.sum(PhaseTransition.quantity_loss)
    ).scalar() or 0
    
    total_loss += (transition_loss or 0)
    
    loss_rate = (total_loss / total_initial * 100) if total_initial > 0 else 0
    
    return {
        "total_plants": int(total_plants),
        "active_batches": active_batches,
        "total_greenhouses": total_greenhouses,
        "loss_rate": round(loss_rate, 2)
    }


@router.get("/plants-by-phase")
async def get_plants_by_phase(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get plant distribution by phase
    Returns: Array of {phase, count}
    """
    
    # Query all batches and sum quantities per phase
    a1_total = db.query(func.sum(Batch.qty_a1_current)).filter(
        Batch.is_completed == False
    ).scalar() or 0
    
    a2_total = db.query(func.sum(Batch.qty_a2_current)).filter(
        Batch.is_completed == False
    ).scalar() or 0
    
    a3_total = db.query(func.sum(Batch.qty_a3_current)).filter(
        Batch.is_completed == False
    ).scalar() or 0
    
    a4_total = db.query(func.sum(Batch.qty_a4_current)).filter(
        Batch.is_completed == False
    ).scalar() or 0
    
    a5_total = db.query(func.sum(Batch.qty_a5_sold)).scalar() or 0
    
    return [
        {"phase": "A1", "count": int(a1_total)},
        {"phase": "A2", "count": int(a2_total)},
        {"phase": "A3", "count": int(a3_total)},
        {"phase": "A4", "count": int(a4_total)},
        {"phase": "A5", "count": int(a5_total)}
    ]


@router.get("/plants-by-variety")
async def get_plants_by_variety(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get plant distribution by variety (top N varieties)
    Returns: Array of {variety_name, count}
    """
    
    # Query batches grouped by variety
    results = db.query(
        Variety.variety_name,
        func.sum(
            Batch.qty_a1_current +
            Batch.qty_a2_current +
            Batch.qty_a3_current +
            Batch.qty_a4_current
        ).label('total_count')
    ).join(
        Batch, Batch.variety_id == Variety.id
    ).filter(
        Batch.is_completed == False
    ).group_by(
        Variety.variety_name
    ).order_by(
        func.sum(
            Batch.qty_a1_current +
            Batch.qty_a2_current +
            Batch.qty_a3_current +
            Batch.qty_a4_current
        ).desc()
    ).limit(limit).all()
    
    return [
        {
            "variety_name": row.variety_name,
            "count": int(row.total_count or 0)
        }
        for row in results
    ]


@router.get("/loss-trend")
async def get_loss_trend(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get loss trend over time (last N months)
    Returns: Array of {month, loss_count}
    """
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)
    
    # Query phase transitions with losses in date range
    results = db.query(
        extract('year', PhaseTransition.transition_date).label('year'),
        extract('month', PhaseTransition.transition_date).label('month'),
        func.sum(PhaseTransition.quantity_loss).label('total_loss')
    ).filter(
        PhaseTransition.transition_date >= start_date.date(),
        PhaseTransition.transition_date <= end_date.date(),
        PhaseTransition.quantity_loss > 0
    ).group_by(
        extract('year', PhaseTransition.transition_date),
        extract('month', PhaseTransition.transition_date)
    ).order_by(
        extract('year', PhaseTransition.transition_date),
        extract('month', PhaseTransition.transition_date)
    ).all()
    
    # Format results
    trend_data = []
    for row in results:
        month_name = datetime(int(row.year), int(row.month), 1).strftime('%b %Y')
        trend_data.append({
            "month": month_name,
            "loss_count": int(row.total_loss or 0)
        })
    
    return trend_data


@router.get("/greenhouse-utilization")
async def get_greenhouse_utilization(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get greenhouse capacity utilization
    Returns: Array of {greenhouse_name, capacity, current_usage, utilization_percent}
    """
    
    greenhouses = db.query(Greenhouse).filter(
        Greenhouse.is_active == True
    ).all()
    
    utilization_data = []
    for gh in greenhouses:
        # Calculate current usage from batches
        current_usage = db.query(
            func.sum(
                Batch.qty_a1_current +
                Batch.qty_a2_current +
                Batch.qty_a3_current +
                Batch.qty_a4_current
            )
        ).filter(
            Batch.current_greenhouse_id == gh.id,
            Batch.is_completed == False
        ).scalar() or 0
        
        utilization_percent = (current_usage / gh.capacity * 100) if gh.capacity else 0
        
        utilization_data.append({
            "greenhouse_name": gh.greenhouse_name,
            "capacity": gh.capacity or 0,
            "current_usage": int(current_usage),
            "utilization_percent": round(utilization_percent, 1)
        })
    
    return utilization_data


@router.get("/recent-activities")
async def get_recent_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent activities (batch arrivals, phase transitions, losses)
    Returns: Array of {type, description, date}
    """
    
    activities = []
    
    # Recent batch arrivals (last N containers)
    recent_containers = db.query(Container).order_by(
        Container.arrival_date.desc()
    ).limit(5).all()
    
    for container in recent_containers:
        batch_count = db.query(Batch).filter(
            Batch.container_id == container.id
        ).count()
        
        activities.append({
            "type": "arrival",
            "description": f"Container {container.container_number} arrived with {batch_count} batches",
            "date": container.arrival_date.isoformat()
        })
    
    # Recent phase transitions (last N)
    recent_transitions = db.query(
        PhaseTransition,
        Batch.batch_number,
        Variety.variety_name
    ).join(
        Batch, PhaseTransition.batch_id == Batch.id
    ).join(
        Variety, Batch.variety_id == Variety.id
    ).order_by(
        PhaseTransition.transition_date.desc()
    ).limit(5).all()
    
    for transition, batch_number, variety_name in recent_transitions:
        if transition.quantity_loss > 0:
            activities.append({
                "type": "loss",
                "description": f"Batch {batch_number} ({variety_name}): {transition.quantity_loss} plants lost during {transition.from_phase}→{transition.to_phase}",
                "date": transition.transition_date.isoformat()
            })
        else:
            activities.append({
                "type": "movement",
                "description": f"Batch {batch_number} ({variety_name}): {transition.quantity_moved} plants moved from {transition.from_phase} to {transition.to_phase}",
                "date": transition.transition_date.isoformat()
            })
    
    # Sort all activities by date (most recent first)
    activities.sort(key=lambda x: x['date'], reverse=True)
    
    return activities[:limit]


@router.get("/supplier-performance")
async def get_supplier_performance(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get supplier performance metrics
    Returns: Array of {supplier_name, total_supplied, loss_rate}
    """
    
    # Query batches grouped by supplier
    results = db.query(
        Supplier.supplier_name,
        func.sum(Batch.quantity_actual).label('total_supplied'),
        func.sum(Batch.initial_loss).label('total_loss')
    ).join(
        Batch, Batch.supplier_id == Supplier.id
    ).group_by(
        Supplier.supplier_name
    ).order_by(
        func.sum(Batch.quantity_actual).desc()
    ).limit(limit).all()
    
    performance_data = []
    for row in results:
        loss_rate = (row.total_loss / row.total_supplied * 100) if row.total_supplied else 0
        performance_data.append({
            "supplier_name": row.supplier_name,
            "total_supplied": int(row.total_supplied or 0),
            "loss_rate": round(loss_rate, 2)
        })
    
    return performance_data
