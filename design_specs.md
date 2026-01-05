# Design Specifications

## 1. Database Schema

### Users
- `id`: Integer, Primary Key
- `email`: String, Unique, Not Null
- `password_hash`: String, Not Null
- `full_name`: String
- `role`: String (default 'owner')
- `created_at`: DateTime

### PGs
- `id`: Integer, Primary Key
- `owner_id`: Integer, ForeignKey('users.id')
- `name`: String, Not Null
- `address`: String
- `city`: String
- `created_at`: DateTime

### Rooms
- `id`: Integer, Primary Key
- `pg_id`: Integer, ForeignKey('pgs.id')
- `room_number`: String, Not Null
- `floor`: Integer
- `type`: String (e.g., 'Single', 'Double')

### Beds
- `id`: Integer, Primary Key
- `room_id`: Integer, ForeignKey('rooms.id')
- `bed_number`: String, Not Null
- `is_occupied`: Boolean, Default False
- `monthly_price`: Float

### Tenants
- `id`: Integer, Primary Key
- `bed_id`: Integer, ForeignKey('beds.id'), Unique (One tenant per bed)
- `pg_id`: Integer, ForeignKey('pgs.id') (for easier querying)
- `name`: String, Not Null
- `phone`: String, Not Null
- `email`: String
- `id_proof`: String (Text/Url)
- `check_in_date`: Date
- `check_out_date`: Date (Nullable)
- `status`: String ('active', 'checked_out')
- `security_deposit`: Float

### RentRecords
- `id`: Integer, Primary Key
- `tenant_id`: Integer, ForeignKey('tenants.id')
- `pg_id`: Integer, ForeignKey('pgs.id')
- `month`: Date (First day of month)
- `amount_due`: Float
- `amount_paid`: Float, Default 0
- `status`: String ('pending', 'paid', 'partial')
- `payment_date`: Date (Nullable)

### Complaints
- `id`: Integer, Primary Key
- `tenant_id`: Integer, ForeignKey('tenants.id')
- `pg_id`: Integer, ForeignKey('pgs.id')
- `title`: String
- `description`: Text
- `status`: String ('open', 'resolved')
- `created_at`: DateTime
- `resolved_at`: DateTime

## 2. API Endpoints

### Auth
- `POST /auth/login` -> { access_token }
- `POST /auth/register` (Optional for MVP, maybe seed only)

### PGs
- `GET /pgs` -> List[PG]
- `POST /pgs` -> PG
- `GET /pgs/{id}` -> PG (with rooms summary)

### Rooms & Beds
- `POST /pgs/{id}/rooms` -> Room
- `POST /rooms/{id}/beds` -> Bed

### Tenants
- `GET /tenants` -> List[Tenant] (Filter by pg_id, status)
- `POST /tenants` -> Tenant (Assigns bed automatically or explicitly)
- `POST /tenants/{id}/checkout` -> Tenant

### Rent
- `GET /rents` -> List[RentRecord] (Filter by month, status)
- `POST /rents/generate` -> (Triggers generation for current month)
- `PUT /rents/{id}/pay` -> RentRecord

### Complaints
- `GET /complaints`
- `POST /complaints`
- `PUT /complaints/{id}/resolve`
