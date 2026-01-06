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
    tenant?: {
        id: number;
        name: string;
        phone: string;
    };
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
    rent_records?: RentRecord[];
    bed?: {
        id: number;
        bed_number: string;
        monthly_price: number;
        room?: {
            id: number;
            room_number: string;
            floor: number;
            type: string;
        };
    };
    pg?: {
        id: number;
        name: string;
    };
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

export interface DashboardStats {
    total_pgs: number;
    total_rooms: number;
    total_beds: number;
    occupied_beds: number;
    occupancy_rate: number;
    total_expected_rent: number;
    total_collected_rent: number;
    total_pending_rent: number;
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
