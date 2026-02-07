"""
Users router - User management (Admin only)
Session 10: New router for user CRUD
Session 11: Added RBAC protection
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models import User
from ..auth import get_password_hash  # Use same hash as login
from ..middleware import require_admin  # RBAC

router = APIRouter()


@router.get("/")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or username"),
    current_user: User = Depends(require_admin),  # Admin only
    db: Session = Depends(get_db)
):
    """Get all users with filters - Admin only"""
    
    query = db.query(User)
    
    # Apply filters
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    # Build response (exclude password_hash)
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    
    return {
        "data": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/roles")
async def get_roles():
    """Get available user roles"""
    return {
        "roles": [
            {"value": "admin", "label": "Admin", "description": "Full access, manage users"},
            {"value": "supervisor", "label": "Supervisor", "description": "View reports, manage batches"},
            {"value": "operator", "label": "Operator", "description": "Record loss, view batches"}
        ]
    }


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user by ID"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: dict,
    current_user: User = Depends(require_admin),  # Admin only
    db: Session = Depends(get_db)
):
    """Create a new user - Admin only"""
    
    username = user_data.get('username')
    password = user_data.get('password')
    full_name = user_data.get('full_name')
    email = user_data.get('email')
    phone = user_data.get('phone')
    role = user_data.get('role', 'operator')
    
    # Validate required fields
    if not username or not password or not full_name:
        raise HTTPException(
            status_code=400, 
            detail="username, password, and full_name are required"
        )
    
    # Validate role
    valid_roles = ['admin', 'supervisor', 'operator']
    if role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"Username '{username}' already exists"
        )
    
    # Check if email already exists (if provided)
    if email:
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=f"Email '{email}' already exists"
            )
    
    # Create user
    new_user = User(
        username=username,
        password_hash=get_password_hash(password),
        full_name=full_name,
        email=email,
        phone=phone,
        role=role,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "message": "User created successfully"
    }


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    user_data: dict,
    current_user: User = Depends(require_admin),  # Admin only
    db: Session = Depends(get_db)
):
    """Update user information - Admin only"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fields that can be updated
    if 'full_name' in user_data and user_data['full_name']:
        user.full_name = user_data['full_name']
    
    if 'email' in user_data:
        # Check if email is unique
        if user_data['email']:
            existing = db.query(User).filter(
                User.email == user_data['email'],
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already exists")
        user.email = user_data['email']
    
    if 'phone' in user_data:
        user.phone = user_data['phone']
    
    if 'role' in user_data and user_data['role']:
        valid_roles = ['admin', 'supervisor', 'operator']
        if user_data['role'] not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        user.role = user_data['role']
    
    if 'is_active' in user_data:
        user.is_active = user_data['is_active']
    
    # Update password if provided
    if 'password' in user_data and user_data['password']:
        user.password_hash = get_password_hash(user_data['password'])
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "message": "User updated successfully"
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),  # Admin only
    db: Session = Depends(get_db)
):
    """Deactivate user (soft delete) - Admin only"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting the last admin
    if user.role == 'admin':
        admin_count = db.query(func.count(User.id)).filter(
            User.role == 'admin',
            User.is_active == True
        ).scalar()
        
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last active admin user"
            )
    
    # Soft delete - just deactivate
    user.is_active = False
    db.commit()
    
    return {
        "message": f"User '{user.username}' has been deactivated"
    }


@router.post("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(require_admin),  # Admin only
    db: Session = Depends(get_db)
):
    """Reactivate a deactivated user - Admin only"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_active:
        raise HTTPException(status_code=400, detail="User is already active")
    
    user.is_active = True
    db.commit()
    
    return {
        "message": f"User '{user.username}' has been activated"
    }


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    password_data: dict,
    current_user: User = Depends(require_admin),  # Admin only
    db: Session = Depends(get_db)
):
    """Reset user password - Admin only"""
    
    new_password = password_data.get('new_password')
    
    if not new_password:
        raise HTTPException(status_code=400, detail="new_password is required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {
        "message": f"Password for user '{user.username}' has been reset"
    }
