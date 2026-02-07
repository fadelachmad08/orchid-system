"""
SQLAlchemy models for Orchid Management System
Updated Session 7: Added PhaseTransition model
"""
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text, Date, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    phone = Column(String(20))
    role = Column(String(20), nullable=False, default="staff")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))


class Supplier(Base):
    """Supplier model - stores orchid supplier information"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String(50), unique=True, nullable=False, index=True)
    supplier_name = Column(String(200), nullable=False)
    country = Column(String(100))
    contact_person = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)

    # Relationships
    batches = relationship("Batch", back_populates="supplier")
    containers = relationship("Container", back_populates="supplier")


class Variety(Base):
    """Variety model - stores orchid variety/species information"""
    __tablename__ = "varieties"

    id = Column(Integer, primary_key=True, index=True)
    variety_code = Column(String(50), unique=True, nullable=False, index=True)
    variety_name = Column(String(200), nullable=False)
    cross_info = Column(Text)
    flower_size_cm = Column(Numeric(5, 2))
    plant_height_cm = Column(String(20))
    grade = Column(String(10))
    qr_code = Column(String(255), unique=True)
    photo_url = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)

    # Relationships
    batches = relationship("Batch", back_populates="variety")


class Greenhouse(Base):
    """Greenhouse model - stores greenhouse facility information"""
    __tablename__ = "greenhouses"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_code = Column(String(50), unique=True, nullable=False, index=True)
    greenhouse_name = Column(String(100), nullable=False)
    location = Column(String(100))
    capacity = Column(Integer)
    current_usage = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)

    # Relationships
    batches = relationship("Batch", back_populates="current_greenhouse")


class Container(Base):
    """Container model - stores arrival container information"""
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    container_number = Column(String(100), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    arrival_date = Column(Date, nullable=False)
    total_quantity_expected = Column(Integer)
    total_quantity_actual = Column(Integer)
    initial_loss = Column(Integer)
    packing_list_file_url = Column(String(255))
    status = Column(String(20), default="active")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)

    # Relationships
    supplier = relationship("Supplier", back_populates="containers")
    batches = relationship("Batch", back_populates="container")
    age_groups = relationship("AgeGroup", back_populates="container")

class AgeGroup(Base):
    """AgeGroup model - kelompok umur dalam satu container (misal: Stok Januari, Stok Februari)"""
    __tablename__ = "age_groups"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # "Januari 2025", "Februari 2025"
    total_quantity = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    notes = Column(Text)

    # Relationships
    container = relationship("Container", back_populates="age_groups")
    batches = relationship("Batch", back_populates="age_group")
    

class Batch(Base):
    """Batch model - stores production batch information with phase tracking"""
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String(100), unique=True, nullable=False, index=True)
    container_id = Column(Integer, ForeignKey("containers.id"))
    age_group_id = Column(Integer, ForeignKey("age_groups.id"), index=True)
    variety_id = Column(Integer, ForeignKey("varieties.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    pot_size_initial = Column(String(10))
    quantity_expected = Column(Integer, nullable=False)
    quantity_actual = Column(Integer, nullable=False)
    initial_loss = Column(Integer, default=0)
    current_phase = Column(String(2), nullable=False, default="A1")
    current_greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"))
    
    # Phase quantities
    qty_a1_start = Column(Integer, nullable=False)
    qty_a1_current = Column(Integer, default=0)
    qty_a2_start = Column(Integer, default=0)
    qty_a2_current = Column(Integer, default=0)
    qty_a3_start = Column(Integer, default=0)
    qty_a3_current = Column(Integer, default=0)
    qty_a4_start = Column(Integer, default=0)
    qty_a4_current = Column(Integer, default=0)
    qty_a5_sold = Column(Integer, default=0)
    
    # Dates
    date_received = Column(Date, nullable=False)
    date_a1_entry = Column(Date)
    date_a2_entry = Column(Date)
    date_a3_entry = Column(Date)
    date_a4_entry = Column(Date)
    date_a5_entry = Column(Date)
    estimated_a2_date = Column(Date)
    estimated_a3_date = Column(Date)
    estimated_a4_date = Column(Date)
    estimated_a5_date = Column(Date)
    
    is_completed = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    container = relationship("Container", back_populates="batches")
    age_group = relationship("AgeGroup", back_populates="batches")
    variety = relationship("Variety", back_populates="batches")
    supplier = relationship("Supplier", back_populates="batches")
    current_greenhouse = relationship("Greenhouse", back_populates="batches")
    phase_transitions = relationship("PhaseTransition", back_populates="batch", order_by="PhaseTransition.transition_date.desc()")


class PhaseTransition(Base):
    """
    PhaseTransition model - tracks all phase movements and losses
    Session 7: New table for complete traceability
    """
    __tablename__ = "phase_transitions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False, index=True)
    
    # Phase movement
    from_phase = Column(String(2), nullable=False)  # A1, A2, A3, A4
    to_phase = Column(String(2), nullable=False)    # A2, A3, A4, A5
    
    # Quantities
    quantity_before = Column(Integer, nullable=False)  # Qty before transition
    quantity_moved = Column(Integer, nullable=False)   # Qty successfully moved
    quantity_loss = Column(Integer, default=0)         # Qty rejected/dead
    
    # Loss details
    loss_reason = Column(String(50))  # disease, damage, dead, weak, other
    loss_notes = Column(Text)
    
    # Transition info
    transition_date = Column(Date, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)

    # Relationships
    batch = relationship("Batch", back_populates="phase_transitions")


class Notification(Base):
    """
    Notification model - stores user notifications for events and alerts
    Session 13: Notification System
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification details
    type = Column(String(20), nullable=False)  # success, warning, error, info
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255))  # Optional link to related page
    
    # Status
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
