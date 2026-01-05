You are a team of senior full-stack engineers, a product designer, and a tech# Product Requirements Document (PRD) - PGKhata
## Tenant Management System for PGs** for Indian PG owners (Pune-focused).
This product is NOT a tenant marketplace.
Scope is strictly limited to managing existing tenants, rent tracking, and basic operations.

========================
PRODUCT GOAL
========================
A mobile-first, simple, fast Progressive Web App (PWA) that allows PG owners / caretakers to:
- Manage PGs, rooms, beds
- Manage tenants
- Track monthly rent payments
- See who has not paid
- Send reminders later (API ready, no WhatsApp integration in MVP)

Target users are non-technical PG owners and caretakers.
UX must be extremely simple and mobile-first.

========================
TECH STACK (STRICT)
========================
Frontend:
- React + TypeScript
- PWA enabled
- Mobile-first UI
- Minimal UI library (Tailwind or simple CSS)
- No heavy animations

Backend:
- Python + FastAPI
- PostgreSQL
- SQLAlchemy ORM
- JWT authentication
- REST APIs only (no GraphQL)

General:
- Keep architecture SIMPLE, CLEAN, and FAST
- No microservices
- No over-engineering
- Monolith backend is preferred
- Easy to deploy on a single VM later

========================
CORE FEATURES (MVP ONLY)
========================

1. Authentication
- Owner login (email + password)
- JWT based auth
- No social login

2. PG Structure
- Create PG
- Add Rooms
- Add Beds
- View vacant / occupied beds

3. Tenant Management
- Add tenant:
  - Name
  - Phone number
  - ID proof (text field)
  - Assigned bed
  - Monthly rent
  - Security deposit
  - Check-in date
- Check-out tenant
- Tenant status: Active / Checked-out

4. Rent Tracking
- Auto-generate monthly rent records per tenant
- Rent status: Paid / Pending
- Mark rent as paid manually
- View:
  - Tenants with pending rent
  - Monthly collection summary

5. Basic Complaints
- Tenant can raise a complaint (simple text)
- Owner can mark it as resolved

========================
OUT OF SCOPE (DO NOT BUILD)
========================
- Tenant discovery / listings
- Online payments
- GST / accounting
- Food / inventory
- Staff management
- Notifications / WhatsApp integration
- Admin panel

========================
UI / UX GUIDELINES
========================
- Mobile-first layout
- One primary action per screen
- Large touch targets
- Minimal text
- Simple navigation (Bottom tabs or Drawer)
- No dashboards with too many charts

Screens required:
- Login
- PG list
- PG details (rooms & beds)
- Tenant list
- Add tenant
- Rent due list
- Monthly summary
- Complaints list

========================
DATABASE DESIGN
========================
Design normalized tables for:
- users
- pgs
- rooms
- beds
- tenants
- rent_records
- complaints

Include:
- Proper foreign keys
- Indexes on frequently queried fields
- Soft delete where needed

========================
BACKEND REQUIREMENTS
========================
- FastAPI project structure with routers
- Clear separation:
  - routes
  - services
  - models
  - schemas
- Input validation using Pydantic
- Error handling with proper HTTP codes
- JWT middleware
- Seed script with sample data

========================
FRONTEND REQUIREMENTS
========================
- Clean folder structure
- API layer abstraction
- Reusable components
- Simple state management (Context or minimal store)
- PWA config with offline shell support
- Forms with basic validation
- Optimistic UI where useful

========================
DELIVERABLES
========================
1. High-level architecture diagram (text-based)
2. Database schema (tables + fields)
3. Backend folder structure
4. API endpoints list
5. Frontend folder structure
6. Core UI screens (JSX + CSS)
7. Setup & run instructions (local dev)
8. Clear comments explaining WHY choices were made

========================
IMPORTANT CONSTRAINTS
========================
- Keep code readable over clever
- Prefer clarity over abstraction
- Assume future scalability but DO NOT prematurely optimize
- Everything should be understandable by a junior developer

Start by:
1. Designing the database schema
2. Defining API contracts
3. Implementing backend first
4. Then frontend

DO NOT SKIP STEPS.
