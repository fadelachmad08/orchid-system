# Orchid Management System - Backend API

FastAPI backend for managing 300,000+ Phalaenopsis orchid plants.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

File `.env` already created with Railway database connection.

### 3. Run Development Server

```bash
uvicorn app.main:app --reload
```

Server will start at: `http://localhost:8000`

### 4. Access API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Authentication endpoints
│       ├── suppliers.py     # Suppliers CRUD
│       └── varieties.py     # Varieties CRUD
├── .env                     # Environment variables
└── requirements.txt         # Python dependencies
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/{id}` - Get supplier detail
- `PUT /api/suppliers/{id}` - Update supplier
- `DELETE /api/suppliers/{id}` - Delete supplier

### Varieties
- `GET /api/varieties` - List all varieties
- `POST /api/varieties` - Create variety
- `GET /api/varieties/{id}` - Get variety detail
- `PUT /api/varieties/{id}` - Update variety
- `DELETE /api/varieties/{id}` - Delete variety

## 🧪 Testing

### Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

### Test Health Check

```bash
curl http://localhost:8000/api/health
```

## 🔒 Authentication

All endpoints (except `/api/auth/login` and `/api/auth/register`) require JWT token authentication.

**Header format:**
```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database

Connected to Railway PostgreSQL:
- Host: tramway.proxy.rlwy.net:45952
- Database: railway
- Schema: public
- 15 tables created in Session 1

## 🌐 CORS

CORS is enabled for all origins (development mode).
In production, update `main.py` to allow only frontend domain.

## 📝 Notes

- Session 2: Authentication + Master Data CRUD ✅
- Session 3: Excel Import + Batch Management
- Session 4: Movement + Loss Recording
- Session 5+: Advanced features

## 👨‍💻 Developer

Built by Fadel with Claude
Date: November 2025
Version: 1.0.0
