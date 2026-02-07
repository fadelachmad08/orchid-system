"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    """Base user schema"""
    username: str
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: str = "staff"

class UserCreate(UserBase):
    """Schema for creating user"""
    password: str

class UserUpdate(BaseModel):
    """Schema for updating user"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# AUTHENTICATION SCHEMAS
# ============================================================================

class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema for token data"""
    username: Optional[str] = None

class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str
    password: str


# ============================================================================
# SUPPLIER SCHEMAS
# ============================================================================

class SupplierBase(BaseModel):
    """Base supplier schema"""
    supplier_code: str
    supplier_name: str
    country: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    """Schema for creating supplier"""
    pass

class SupplierUpdate(BaseModel):
    """Schema for updating supplier"""
    supplier_name: Optional[str] = None
    country: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class SupplierResponse(SupplierBase):
    """Schema for supplier response"""
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# VARIETY SCHEMAS
# ============================================================================

class VarietyBase(BaseModel):
    """Base variety schema"""
    variety_code: str
    variety_name: str
    cross_info: Optional[str] = None
    flower_size_cm: Optional[float] = None
    plant_height_cm: Optional[str] = None
    grade: Optional[str] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None

class VarietyCreate(VarietyBase):
    """Schema for creating variety"""
    pass

class VarietyUpdate(BaseModel):
    """Schema for updating variety"""
    variety_name: Optional[str] = None
    cross_info: Optional[str] = None
    flower_size_cm: Optional[float] = None
    plant_height_cm: Optional[str] = None
    grade: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class VarietyResponse(VarietyBase):
    """Schema for variety response"""
    id: int
    qr_code: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================
# CONTAINER SCHEMAS
# ============================================

class ContainerBase(BaseModel):
    container_number: str
    supplier_id: int
    arrival_date: datetime
    total_quantity_expected: Optional[int] = None
    total_quantity_actual: Optional[int] = None
    initial_loss: Optional[int] = None
    status: Optional[str] = "pending"
    notes: Optional[str] = None

class ContainerCreate(ContainerBase):
    pass

class ContainerResponse(ContainerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================
# BATCH SCHEMAS
# ============================================

class BatchBase(BaseModel):
    container_id: int
    variety_id: int
    quantity: int  # Initial quantity
    batch_number: Optional[str] = None
    notes: Optional[str] = None

class BatchCreate(BatchBase):
    pass

class BatchResponse(BaseModel):
    id: int
    batch_number: str
    container_id: int
    variety_id: int
    
    # Phase quantities
    qty_a1_start: Optional[int] = None
    qty_a1_current: Optional[int] = None
    qty_a2_start: Optional[int] = None
    qty_a2_current: Optional[int] = None
    qty_a3_start: Optional[int] = None
    qty_a3_current: Optional[int] = None
    qty_a4_start: Optional[int] = None
    qty_a4_current: Optional[int] = None
    qty_a5_sold: Optional[int] = None
    
    # Dates
    date_received: Optional[datetime] = None
    date_a1_entry: Optional[datetime] = None
    date_a2_entry: Optional[datetime] = None
    date_a3_entry: Optional[datetime] = None
    date_a4_entry: Optional[datetime] = None
    
    # Estimated dates
    estimated_a2_date: Optional[datetime] = None
    estimated_a3_date: Optional[datetime] = None
    estimated_a4_date: Optional[datetime] = None
    estimated_a5_date: Optional[datetime] = None
    
    current_phase: Optional[str] = None
    is_completed: Optional[bool] = False
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# GREENHOUSE SCHEMAS
# ============================================================================

class GreenhouseBase(BaseModel):
    """Base greenhouse schema"""
    greenhouse_code: str
    greenhouse_name: str
    location: Optional[str] = None
    capacity: Optional[int] = None
    notes: Optional[str] = None

class GreenhouseCreate(GreenhouseBase):
    """Schema for creating greenhouse"""
    pass

class GreenhouseUpdate(BaseModel):
    """Schema for updating greenhouse"""
    greenhouse_name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class GreenhouseResponse(GreenhouseBase):
    """Schema for greenhouse response"""
    id: int
    current_usage: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# BATCH SCHEMAS (Basic - untuk Session 3 nanti diperluas)
# ============================================================================

class BatchBase(BaseModel):
    """Base batch schema"""
    batch_number: str
    variety_id: int
    supplier_id: int
    quantity_expected: int
    quantity_actual: int
    date_received: date

class BatchResponse(BatchBase):
    """Schema for batch response"""
    id: int
    current_phase: str
    qty_a1_current: int
    qty_a2_current: int
    qty_a3_current: int
    qty_a4_current: int
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
