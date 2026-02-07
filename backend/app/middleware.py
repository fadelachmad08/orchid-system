"""
Middleware and dependencies for role-based access control
Session 11: RBAC implementation
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .database import get_db
from .models import User
from .auth import get_current_user  # Fixed: import from auth, not routers.auth


def require_role(allowed_roles: List[str]):
    """
    Dependency to check if current user has required role
    
    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(['admin']))])
        async def admin_endpoint():
            return {"message": "Admin only"}
    
    Args:
        allowed_roles: List of roles that can access the endpoint
        
    Returns:
        Dependency function
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get('role') not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency to check if current user is admin
    
    Usage:
        @router.delete("/users/{id}")
        async def delete_user(user: User = Depends(require_admin)):
            ...
    """
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_supervisor_or_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency to check if current user is supervisor or admin
    
    Usage:
        @router.post("/batches/{id}/move")
        async def move_batch(user: User = Depends(require_supervisor_or_admin)):
            ...
    """
    if current_user.get('role') not in ['admin', 'supervisor']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor or Admin access required"
        )
    return current_user


# Role permission matrix
ROLE_PERMISSIONS = {
    'admin': {
        'users': ['create', 'read', 'update', 'delete'],
        'suppliers': ['create', 'read', 'update', 'delete'],
        'varieties': ['create', 'read', 'update', 'delete'],
        'containers': ['create', 'read', 'update', 'delete'],
        'batches': ['create', 'read', 'update', 'delete'],
        'phases': ['create', 'read', 'update', 'delete'],
        'greenhouses': ['create', 'read', 'update', 'delete'],
        'reports': ['read', 'export'],
    },
    'supervisor': {
        'users': [],  # No user management
        'suppliers': ['read'],  # View only
        'varieties': ['read'],  # View only
        'containers': ['read'],  # View only
        'batches': ['create', 'read', 'update'],  # Can manage batches
        'phases': ['create', 'read', 'update'],  # Can manage phases
        'greenhouses': ['read', 'update'],  # Can assign greenhouses
        'reports': ['read', 'export'],  # Can view and export reports
    },
    'operator': {
        'users': [],  # No user management
        'suppliers': ['read'],  # View only
        'varieties': ['read'],  # View only
        'containers': ['read'],  # View only
        'batches': ['read'],  # View only
        'phases': ['create', 'read'],  # Can record loss only
        'greenhouses': ['read'],  # View only
        'reports': ['read'],  # View reports only
    }
}


def check_permission(user: dict, resource: str, action: str) -> bool:
    """
    Check if user has permission to perform action on resource
    
    Args:
        user: Current user dict
        resource: Resource name (e.g., 'batches', 'users')
        action: Action name (e.g., 'create', 'read', 'update', 'delete')
        
    Returns:
        True if user has permission, False otherwise
    """
    role = user.get('role') if isinstance(user, dict) else getattr(user, 'role', None)
    
    if role not in ROLE_PERMISSIONS:
        return False
    
    role_perms = ROLE_PERMISSIONS[role]
    if resource not in role_perms:
        return False
    
    return action in role_perms[resource]


def require_permission(resource: str, action: str):
    """
    Dependency to check if current user has permission for resource/action
    
    Usage:
        @router.delete("/suppliers/{id}", dependencies=[Depends(require_permission('suppliers', 'delete'))])
        async def delete_supplier():
            ...
    """
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        if not check_permission(current_user, resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to {action} {resource}"
            )
        return current_user
    
    return permission_checker
