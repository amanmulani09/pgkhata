import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Trash2, Calendar, Phone, Edit2, LogOut, Eye, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import api from '../../services/api';
import type { Tenant, PG, Room, Bed } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

export const TenantsList = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    // Form state
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantPhone, setNewTenantPhone] = useState('+91 ');
    const [newTenantCheckIn, setNewTenantCheckIn] = useState('');
    const [selectedPG, setSelectedPG] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedBed, setSelectedBed] = useState('');
    const [newTenantEmail, setNewTenantEmail] = useState('');
    const [newTenantAadhar, setNewTenantAadhar] = useState('');
    const [newTenantDeposit, setNewTenantDeposit] = useState('0');

    // Edit state
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAadhar, setEditAadhar] = useState('');
    const [editDeposit, setEditDeposit] = useState('0');

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
            const roomsWithVacantBeds = pgData.rooms?.filter(room =>
                room.beds?.some(bed => !bed.is_occupied)
            ) || [];
            setAvailableRooms(roomsWithVacantBeds);
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
                email: newTenantEmail,
                id_proof: newTenantAadhar,
                check_in_date: newTenantCheckIn,
                bed_id: parseInt(selectedBed),
                pg_id: parseInt(selectedPG),
                security_deposit: parseFloat(newTenantDeposit) || 0
            };
            await api.post('/tenants/', payload);
            await fetchTenants();
            setShowAddModal(false);
            setNewTenantName('');
            setNewTenantPhone('+91 ');
            setNewTenantCheckIn('');
            setSelectedPG('');
            setSelectedRoom('');
            setSelectedBed('');
            setNewTenantEmail('');
            setNewTenantAadhar('');
            setNewTenantDeposit('0');
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
            await fetchTenants();
        } catch (error) {
            console.error('Checkout failed', error);
        }
    };

    const handleDeleteTenant = async (tenantId: number) => {
        if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;
        try {
            await api.delete(`/tenants/${tenantId}`);
            await fetchTenants();
        } catch (error) {
            console.error('Delete failed', error);
            alert('Failed to delete tenant');
        }
    };

    const handleEditTenant = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setEditName(tenant.name);
        setEditPhone(tenant.phone);
        setEditEmail(tenant.email || '');
        setEditAadhar(tenant.id_proof || '');
        setEditDeposit(tenant.security_deposit.toString());
        setShowEditModal(true);
    };

    const handleUpdateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;
        setSubmitting(true);
        try {
            await api.put(`/tenants/${selectedTenant.id}`, {
                name: editName,
                phone: editPhone,
                email: editEmail,
                id_proof: editAadhar,
                security_deposit: parseFloat(editDeposit) || 0
            });
            await fetchTenants();
            setShowEditModal(false);
        } catch (error) {
            console.error('Update failed', error);
            alert('Failed to update tenant');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone.includes(searchTerm)
    );

    const sendWhatsAppReminder = (tenant: Tenant) => {
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const message = t('tenants.rent_reminder_msg', { name: tenant.name, month: currentMonth });
        const cleanPhone = tenant.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const remindAllTenants = () => {
        const activeTenants = tenants.filter(t => t.status === 'active');
        if (activeTenants.length === 0) return;

        if (confirm(`Send WhatsApp reminders to ${activeTenants.length} active tenants? This will open multiple tabs.`)) {
            activeTenants.forEach((tenant, index) => {
                // We add a small delay to prevent browser from blocking multiple popups
                setTimeout(() => {
                    sendWhatsAppReminder(tenant);
                }, index * 1000);
            });
        }
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('tenants.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('tenants.subtitle')}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={remindAllTenants}
                        className="flex-1 md:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        disabled={tenants.filter(t => t.status === 'active').length === 0}
                    >
                        <MessageSquare size={20} className="mr-2" />
                        {t('tenants.reminder_all')}
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none shadow-lg shadow-indigo-500/30">
                        <Plus size={20} className="mr-2" />
                        {t('tenants.register_tenant')}
                    </Button>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-8 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-1 text-slate-900">{t('tenants.register_tenant')}</h2>
                        <p className="text-slate-500 mb-6 text-sm">{t('tenants.subtitle')}</p>

                        <form onSubmit={handleAddTenant} className="space-y-4">
                            <Input
                                label={t('tenants.full_name')}
                                placeholder="John Doe"
                                value={newTenantName}
                                onChange={e => setNewTenantName(e.target.value)}
                                required
                            />
                            <PhoneInput
                                label={t('tenants.phone_number')}
                                placeholder="9876543210"
                                value={newTenantPhone}
                                onChange={val => setNewTenantPhone(val)}
                                required
                            />
                            <Input
                                label={t('tenants.email')}
                                type="email"
                                placeholder="john@example.com"
                                value={newTenantEmail}
                                onChange={e => setNewTenantEmail(e.target.value)}
                            />
                            <Input
                                label={t('tenants.id_proof')}
                                placeholder="1234 5678 9012"
                                value={newTenantAadhar}
                                onChange={e => setNewTenantAadhar(e.target.value)}
                            />
                            <Input
                                label={t('tenants.security_deposit')}
                                type="number"
                                placeholder="5000"
                                value={newTenantDeposit}
                                onChange={e => setNewTenantDeposit(e.target.value)}
                            />
                            <Input
                                label={t('tenants.check_in_date')}
                                type="date"
                                value={newTenantCheckIn}
                                onChange={e => setNewTenantCheckIn(e.target.value)}
                                required
                            />
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{t('tenants.select_pg')}</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900"
                                    value={selectedPG}
                                    onChange={e => setSelectedPG(e.target.value)}
                                    required
                                >
                                    <option value="">-- {t('tenants.select_pg')} --</option>
                                    {pgs.map(pg => (
                                        <option key={pg.id} value={pg.id}>{pg.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{t('tenants.select_room')}</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                                    value={selectedRoom}
                                    onChange={e => setSelectedRoom(e.target.value)}
                                    required
                                    disabled={!selectedPG}
                                >
                                    <option value="">-- {t('tenants.select_room')} --</option>
                                    {availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {t('pgs.room_number', { defaultValue: 'Room' })} {room.room_number} ({t(`common.${room.type.toLowerCase()}`, { defaultValue: room.type })} - {t('pgs.floor')} {room.floor})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 ml-1 mb-1.5 block">{t('tenants.assign_bed')}</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
                                    value={selectedBed}
                                    onChange={e => setSelectedBed(e.target.value)}
                                    required
                                    disabled={!selectedRoom}
                                >
                                    <option value="">-- {t('tenants.assign_bed')} --</option>
                                    {availableBeds.map(bed => (
                                        <option key={bed.id} value={bed.id}>
                                            {t('pgs.bed_number', { defaultValue: 'Bed' })} {bed.bed_number} (₹{bed.monthly_price}/{t('common.mo', { defaultValue: 'mo' })})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" isLoading={submitting}>
                                    {t('tenants.register_tenant')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && selectedTenant && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-8 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-1 text-slate-900">{t('tenants.edit_tenant', { defaultValue: 'Edit Tenant' })}</h2>
                        <p className="text-slate-500 mb-6 text-sm">{t('tenants.update_details', { defaultValue: 'Update tenant details.' })}</p>

                        <form onSubmit={handleUpdateTenant} className="space-y-4">
                            <Input
                                label={t('tenants.full_name')}
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                required
                            />
                            <PhoneInput
                                label={t('tenants.phone_number')}
                                value={editPhone}
                                onChange={val => setEditPhone(val)}
                                required
                            />
                            <Input
                                label={t('tenants.email')}
                                type="email"
                                value={editEmail}
                                onChange={e => setEditEmail(e.target.value)}
                            />
                            <Input
                                label={t('tenants.id_proof')}
                                value={editAadhar}
                                onChange={e => setEditAadhar(e.target.value)}
                            />
                            <Input
                                label={t('tenants.security_deposit')}
                                type="number"
                                value={editDeposit}
                                onChange={e => setEditDeposit(e.target.value)}
                            />

                            <div className="flex justify-end gap-3 pt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" isLoading={submitting}>
                                    {t('common.save')}
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
                            placeholder={t('tenants.search_placeholder')}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" className="hidden md:flex bg-white">
                        <Filter size={18} className="mr-2" /> {t('common.filter', { defaultValue: 'Filter' })}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-5">{t('common.name', { defaultValue: 'Name' })}</th>
                                <th className="p-5">{t('common.contact', { defaultValue: 'Contact' })}</th>
                                <th className="p-5">{t('common.status', { defaultValue: 'Status' })}</th>
                                <th className="p-5">{t('common.details', { defaultValue: 'Details' })}</th>
                                <th className="p-5 text-right">{t('common.actions', { defaultValue: 'Actions' })}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            {t('common.loading', { defaultValue: 'Loading tenants...' })}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-500">
                                        {t('tenants.no_tenants', { defaultValue: 'No tenants found matching your search.' })}
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
                                                {tenant.status === 'active' ? t('common.active', { defaultValue: 'Active' }) : t('common.checked_out', { defaultValue: 'Checked Out' })}
                                            </span>
                                        </td>
                                        <td className="p-5 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(tenant.check_in_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right flex justify-end gap-2 text-slate-400">
                                            {tenant.status === 'active' && (
                                                <button
                                                    onClick={() => sendWhatsAppReminder(tenant)}
                                                    className="hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all"
                                                    title={t('tenants.send_reminder')}
                                                >
                                                    <MessageSquare size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/tenants/${tenant.id}`)}
                                                className="hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                                                title={t('common.view_details', { defaultValue: 'View Details' })}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {tenant.status === 'active' && (
                                                <button
                                                    onClick={() => handleCheckout(tenant.id)}
                                                    className="hover:text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-all"
                                                    title={t('tenants.checkout', { defaultValue: 'Checkout' })}
                                                >
                                                    <LogOut size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditTenant(tenant)}
                                                className="hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTenant(tenant.id)}
                                                className="hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
