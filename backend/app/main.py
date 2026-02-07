from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import (
    auth,
    batches,
    containers,
    suppliers,
    varieties,
    greenhouses,
    phase_transitions,
    reports,
    stats,
    users,
    notifications,
    exports,
    imports
)

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Orchid Management System API",
    description="API for managing 300,000+ Phalaenopsis orchid plants",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers with /api prefix
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(batches.router, prefix="/api/batches", tags=["Batches"])
app.include_router(containers.router, prefix="/api/containers", tags=["Containers"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])
app.include_router(varieties.router, prefix="/api/varieties", tags=["Varieties"])
app.include_router(greenhouses.router, prefix="/api/greenhouses", tags=["Greenhouses"])
app.include_router(phase_transitions.router, prefix="/api/phase-transitions", tags=["Phase Transitions"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(exports.router, prefix="/api/exports", tags=["Exports"])
app.include_router(imports.router, prefix="/api/imports", tags=["Imports"])

@app.get("/")
async def root():
    return {
        "message": "Orchid Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
