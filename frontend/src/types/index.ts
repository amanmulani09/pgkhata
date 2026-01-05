export interface User {
    id: number;
    email: string;
    full_name: string;
    is_active: boolean;
}

export interface PG {
    id: number;
    name: string;
    address?: string;
    city?: string;
    owner_id: number;
    rooms?: Room[];
}

export interface Room {
    id: number;
    pg_id: number;
    room_number: string;
    floor: number;
    type: string;
    beds?: Bed[];
}

export interface Bed {
    id: number;
    room_id: number;
    bed_number: string;
    monthly_price: number;
    is_occupied: boolean;
}

export interface Tenant {
    id: number;
    name: string;
    phone: string;
    email?: string;
    id_proof?: string;
    check_in_date: string;
    check_out_date?: string;
    status: 'active' | 'checked_out';
    security_deposit: number;
    pg_id: number;
    bed_id: number;
}

export interface RentRecord {
    id: number;
    tenant_id: number;
    pg_id: number;
    month: string;
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'paid' | 'partial';
    payment_date?: string;
}

export interface Complaint {
    id: number;
    tenant_id: number;
    pg_id: number;
    title: string;
    description?: string;
    status: 'open' | 'resolved';
    created_at: string;
    resolved_at?: string;
}
