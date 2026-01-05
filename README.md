# PGKhata - PG Tenant Management System

A mobile-first PWA for managing Paying Guest (PG) accommodations, built with React, TypeScript, FastAPI, and PostgreSQL.

## Architecture

- **Frontend**: React (Vite), TypeScript, TailwindCSS (Mobile-first design)
- **Backend**: Python FastAPI, SQLAlchemy, Pydantic
- **Database**: PostgreSQL

## Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (running locally)

## Setup Instructions

### 1. Database Setup
Create a PostgreSQL database named `pgkhata`:
```bash
# If using psql
psql postgres
CREATE DATABASE pgkhata;
\q
```
*Note: Ensure your `.env` in `backend/.env` matches your local database credentials.*

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Create virtual environment and install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run database migrations (or create tables via app startup):
```bash
# The app creates tables automatically on first run in this MVP
```

Start the backend server:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.
Docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## Default Login
- **Email**: `admin@example.com`
- **Password**: `password123`

*(Note: If the seed script failed due to DB connection issues, you may need to create this user manually via the `POST /api/v1/users/` endpoint or using a database tool)*.
