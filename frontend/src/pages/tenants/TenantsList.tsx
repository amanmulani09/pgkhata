import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Trash2, Calendar, Phone } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import type { Tenant, PG, Room, Bed } from '../../types';

export const TenantsList = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantPhone, setNewTenantPhone] = useState('');
    const [newTenantCheckIn, setNewTenantCheckIn] = useState('');
    const [selectedPG, setSelectedPG] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedBed, setSelectedBed] = useState('');

    // Helper data
    const [pgs, setPgs] = useState<PG[]>([]);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTenants();
        fetchPGs();
    }, []);

    // When PG changes, fetch rooms
    useEffect(() => {
        if (selectedPG) {
            fetchRoomsForPG(parseInt(selectedPG));
        } else {
            setAvailableRooms([]);
        }
        setSelectedRoom('');
        setSelectedBed('');
    }, [selectedPG]);

    // When Room changes, filter beds
    useEffect(() => {
        if (selectedRoom && selectedPG) {
            const pg = pgs.find(p => p.id === parseInt(selectedPG));
            const room = pg?.rooms?.find(r => r.id === parseInt(selectedRoom));
            const vacantBeds = room?.beds?.filter(bed => !bed.is_occupied) || [];
            setAvailableBeds(vacantBeds);
        } else {
            setAvailableBeds([]);
        }
        setSelectedBed('');
    }, [selectedRoom, selectedPG, pgs]);

    const fetchTenants = async () => {
        try {
            const response = await api.get('/tenants/');
            setTenants(response.data);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPGs = async () => {
        try {
            const response = await api.get('/pgs/');
            setPgs(response.data);
        } catch (error) {
            console.error('Failed to fetch PGs:', error);
        }
    };

    const fetchRoomsForPG = async (pgId: number) => {
        try {
            const pgResponse = await api.get(`/pgs/${pgId}`);
            const pgData: PG = pgResponse.data;
            // Only show rooms that have at least one vacant bed
            const roomsWithVacantBeds = pgData.rooms?.filter(room =>
                room.beds?.some(bed => !bed.is_occupied)
            ) || [];
            setAvailableRooms(roomsWithVacantBeds);
            // Update pgs state with full room/bed data for this PG
            setPgs(prev => prev.map(p => p.id === pgId ? pgData : p));
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                name: newTenantName,
                phone: newTenantPhone,
                check_in_date: newTenantCheckIn,
                bed_id: parseInt(selectedBed),
                pg_id: parseInt(selectedPG),
                security_deposit: 0
            };

            await api.post('/tenants/', payload);
            await fetchTenants();
            setShowAddModal(false);

            // Reset form
            setNewTenantName('');
            setNewTenantPhone('');
            setNewTenantCheckIn('');
            setSelectedPG('');
            setSelectedRoom('');
            setSelectedBed('');
        } catch (error) {
            console.error('Failed to add tenant:', error);
            alert('Failed to add tenant. Please check inputs.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckout = async (tenantId: number) => {
        if (!confirm('Are you sure you want to checkout this tenant? This will free up their bed.')) return;

        try {
            await api.post(`/tenants/${tenantId}/checkout`);
            fetchTenants();
        } catch (error) {
            console.error('Checkout failed', error);
        }
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone.includes(searchTerm)
    );

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tenants</h1>
                    <p className="text-slate-500 mt-1">Manage your tenants and their statuses.</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="shadow-lg shadow-indigo-500/30">
                    <Plus size={20} className="mr-2" />
                    Add Tenant
                </Button>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
                        <h2 className="text-xl font-bold mb-1 text-slate-900">Add New Tenant</h2>
                        <p className="text-slate-500 mb-6 text-sm">Enter tenant details to register them.</p>

                        <form onSubmit={handleAddTenant} className="space-y-4">
                            <Input
                                label="Full Name"
                                placeholder="John Doe"
                                value={newTenantName}
                                onChange={e => setNewTenantName(e.target.value)}
                                required
                            />
                            <Input
                                label="Phone Number"
                                placeholder="+91 9876543210"
                                value={newTenantPhone}
                                onChange={e => setNewTenantPhone(e.target.value)}
                                required
                            />
                            <Input
                                label="Check-in Date"
                                type="date"
                                value={newTenantCheckIn}
                                onChange={e => setNewTenantCheckIn(e.target.value)}
                                required
                            />

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Select PG</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900"
                                    value={selectedPG}
                                    onChange={e => setSelectedPG(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select PG --</option>
                                    {pgs.map(pg => (
                                        <option key={pg.id} value={pg.id}>{pg.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Select Room</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                                    value={selectedRoom}
                                    onChange={e => setSelectedRoom(e.target.value)}
                                    required
                                    disabled={!selectedPG}
                                >
                                    <option value="">-- Select Room --</option>
                                    {availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            Room {room.room_number} ({room.type} - Floor {room.floor})
                                        </option>
                                    ))}
                                    {selectedPG && availableRooms.length === 0 && (
                                        <option disabled>No rooms with vacant beds</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 ml-1 mb-1.5 block">Assign Bed</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                                    value={selectedBed}
                                    onChange={e => setSelectedBed(e.target.value)}
                                    required
                                    disabled={!selectedRoom}
                                >
                                    <option value="">-- Select Bed --</option>
                                    {availableBeds.map(bed => (
                                        <option key={bed.id} value={bed.id}>
                                            Bed {bed.bed_number} (₹{bed.monthly_price}/mo)
                                        </option>
                                    ))}
                                    {selectedRoom && availableBeds.length === 0 && (
                                        <option disabled>No vacant beds in this room</option>
                                    )}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={submitting}>
                                    Register Tenant
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            placeholder="Search tenants by name or phone..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" className="hidden md:flex bg-white">
                        <Filter size={18} className="mr-2" /> Filter
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-5">Name</th>
                                <th className="p-5">Contact</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Details</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            Loading tenants...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        No tenants found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-semibold shadow-sm">
                                                    {tenant.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{tenant.name}</div>
                                                    <div className="text-xs text-slate-400">ID: #{tenant.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Phone size={14} className="text-slate-400" />
                                                {tenant.phone}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${tenant.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${tenant.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                                                    }`}></span>
                                                {tenant.status === 'active' ? 'Active' : 'Checked Out'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(tenant.check_in_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            {tenant.status === 'active' && (
                                                <button
                                                    onClick={() => handleCheckout(tenant.id)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                    title="Checkout Tenant"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};
