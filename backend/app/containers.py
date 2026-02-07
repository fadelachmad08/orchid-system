from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import Container, Supplier
from ..schemas import ContainerCreate, ContainerResponse

router = APIRouter(tags=["containers"])

@router.post("/", response_model=ContainerResponse, status_code=status.HTTP_201_CREATED)
async def create_container(
    container: ContainerCreate,
    db: Session = Depends(get_db)
):
    """Create a new container"""
    
    # Check if supplier exists
    supplier = db.query(Supplier).filter(Supplier.id == container.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Create container
    db_container = Container(**container.dict())
    db.add(db_container)
    db.commit()
    db.refresh(db_container)
    
    return db_container

@router.get("/", response_model=List[ContainerResponse])
async def get_containers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all containers"""
    containers = db.query(Container).offset(skip).limit(limit).all()
    return containers

@router.get("/{container_id}", response_model=ContainerResponse)
async def get_container(
    container_id: int,
    db: Session = Depends(get_db)
):
    """Get container by ID"""
    container = db.query(Container).filter(Container.id == container_id).first()
    if not container:
        raise HTTPException(status_code=404, detail="Container not found")
    return container