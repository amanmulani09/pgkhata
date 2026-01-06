import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Home, Edit2, Trash2, Banknote, User as UserIcon } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import type { PG, Room, Bed } from '../../types';

import { useLanguage } from '../../hooks/useLanguage';

export const PGDetails = () => {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const [pg, setPg] = useState<PG | null>(null);
    const [loading, setLoading] = useState(true);

    // Drilling state
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

    // Add Room State
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [roomNumber, setRoomNumber] = useState('');
    const [floor, setFloor] = useState('');
    const [roomType, setRoomType] = useState('Double');
    const [addingRoom, setAddingRoom] = useState(false);

    // Add Bed State
    const [addingBedToRoomId, setAddingBedToRoomId] = useState<number | null>(null);
    const [bedNumber, setBedNumber] = useState('');
    const [bedPrice, setBedPrice] = useState('');
    const [addingBed, setAddingBed] = useState(false);

    // Edit states
    const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
    const [editRoomNumber, setEditRoomNumber] = useState('');
    const [editFloor, setEditFloor] = useState('');
    const [editRoomType, setEditRoomType] = useState('Double');

    const [editingBedId, setEditingBedId] = useState<number | null>(null);
    const [editBedNumber, setEditBedNumber] = useState('');
    const [editBedPrice, setEditBedPrice] = useState('');

    // Rent Collection State
    const [showRentModal, setShowRentModal] = useState(false);
    const [selectedTenantForRent, setSelectedTenantForRent] = useState<{ id: number, name: string, bed_id: number } | null>(null);
    const [rentAmount, setRentAmount] = useState('');
    const [submittingRent, setSubmittingRent] = useState(false);

    useEffect(() => {
        if (id) fetchPGDetails();
    }, [id]);

    const fetchPGDetails = async () => {
        try {
            const response = await api.get(`/pgs/${id}`);
            setPg(response.data);
        } catch (error) {
            console.error('Failed to fetch PG:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setAddingRoom(true);
        try {
            const payload = {
                room_number: roomNumber,
                floor: parseInt(floor) || 0,
                type: roomType
            };
            await api.post(`/pgs/${id}/rooms`, payload);
            await fetchPGDetails();
            setShowAddRoom(false);
            setRoomNumber('');
            setFloor('');
        } catch (error) {
            console.error("Failed to add room", error);
        } finally {
            setAddingRoom(false);
        }
    };

    const handleUpdateRoom = async (e: React.FormEvent, roomId: number) => {
        e.preventDefault();
        try {
            await api.put(`/pgs/rooms/${roomId}`, {
                room_number: editRoomNumber,
                floor: parseInt(editFloor) || 0,
                type: editRoomType
            });
            await fetchPGDetails();
            setEditingRoomId(null);
        } catch (error) {
            console.error("Failed to update room", error);
        }
    };

    const handleDeleteRoom = async (roomId: number) => {
        if (!confirm(t('common.confirm_delete_room'))) return;
        try {
            await api.delete(`/pgs/rooms/${roomId}`);
            await fetchPGDetails();
        } catch (error) {
            console.error("Failed to delete room", error);
        }
    };

    const handleAddBed = async (e: React.FormEvent, roomId: number) => {
        e.preventDefault();
        setAddingBed(true);
        try {
            const payload = {
                bed_number: bedNumber,
                monthly_price: parseFloat(bedPrice) || 0,
                is_occupied: false
            };
            await api.post(`/pgs/rooms/${roomId}/beds`, payload);
            await fetchPGDetails();
            setAddingBedToRoomId(null);
            setBedNumber('');
            setBedPrice('');
        } catch (error) {
            console.error("Failed to add bed", error);
        } finally {
            setAddingBed(false);
        }
    };

    const handleUpdateBed = async (e: React.FormEvent, bedId: number) => {
        e.preventDefault();
        try {
            await api.put(`/pgs/beds/${bedId}`, {
                bed_number: editBedNumber,
                monthly_price: parseFloat(editBedPrice) || 0
            });
            await fetchPGDetails();
            setEditingBedId(null);
        } catch (error) {
            console.error("Failed to update bed", error);
        }
    };

    const handleDeleteBed = async (bedId: number) => {
        if (!confirm(t('common.confirm_delete_bed'))) return;
        try {
            await api.delete(`/pgs/beds/${bedId}`);
            await fetchPGDetails();
        } catch (error) {
            console.error("Failed to delete bed", error);
        }
    };

    const handleOpenRentModal = (bed: Bed) => {
        if (!bed.tenant) return;
        setSelectedTenantForRent({
            id: bed.tenant.id,
            name: bed.tenant.name,
            bed_id: bed.id
        });
        setRentAmount(String(bed.monthly_price));
        setShowRentModal(true);
    };

    const handleReceiveRent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForRent) return;
        setSubmittingRent(true);
        try {
            const today = new Date();
            const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            await api.post('/rents/generate');
            const rentsRes = await api.get('/rents/', { params: { curr_month: monthStart } });
            const existingRent = rentsRes.data.find((r: any) => r.tenant_id === selectedTenantForRent.id);
            if (existingRent) {
                await api.put(`/rents/${existingRent.id}`, {
                    amount_paid: parseFloat(rentAmount),
                    payment_date: new Date().toISOString().split('T')[0],
                    status: 'paid'
                });
                alert(t('rent.recorded_success', { name: selectedTenantForRent.name }));
                setShowRentModal(false);
            } else {
                alert(t('rent.generation_failed'));
            }
        } catch (error) {
            console.error("Failed to receive rent", error);
            alert(t('rent.record_failed'));
        } finally {
            setSubmittingRent(false);
        }
    };

    if (loading) return <Layout><div className="flex items-center justify-center min-h-[400px]">{t('common.loading')}</div></Layout>;
    if (!pg) return <Layout><div className="text-center py-20">{t('common.not_found')}</div></Layout>;

    const hasRooms = pg.rooms && pg.rooms.length > 0;
    const selectedRoom = pg.rooms?.find(r => r.id === selectedRoomId);

    return (
        <Layout>
            {/* Header / Breadcrumbs */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/pgs" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{pg.name}</h1>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <span className="flex items-center gap-1"><Home size={14} /> {pg.address}, {pg.city}</span>
                        {selectedRoom && (
                            <>
                                <span className="text-slate-300">/</span>
                                <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg">{t('pgs.room_number', { defaultValue: 'Room' })} {selectedRoom.room_number}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Drill-down Navigation Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    {selectedRoom ? (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedRoomId(null)} className="text-slate-500 hover:text-indigo-600 pl-0">
                            <ChevronLeft size={18} className="mr-1" /> {t('common.back_to_list')}
                        </Button>
                    ) : (
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{t('pgs.property_structure')}</h2>
                    )}
                </div>
                {!selectedRoom && (
                    <Button onClick={() => setShowAddRoom(!showAddRoom)} variant={showAddRoom ? "secondary" : "primary"} size="sm">
                        <Plus size={18} className="mr-2" /> {showAddRoom ? t('common.cancel') : t('pgs.add_new_room')}
                    </Button>
                )}
            </div>

            {/* Add Room Form */}
            {showAddRoom && !selectedRoom && (
                <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-100 mb-8 animate-in slide-in-from-top-4 max-w-lg">
                    <h3 className="font-bold text-slate-900 mb-5">{t('pgs.configure_room')}</h3>
                    <form onSubmit={handleAddRoom} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label={t('pgs.room_number')} placeholder="e.g. 101" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required />
                            <Input label={t('pgs.floor')} type="number" placeholder="0" value={floor} onChange={e => setFloor(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">{t('pgs.room_type')}</label>
                            <select
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                value={roomType}
                                onChange={e => setRoomType(e.target.value)}
                            >
                                <option value="Single">{t('common.single')}</option>
                                <option value="Double">{t('common.double')}</option>
                                <option value="Triple">{t('common.triple')}</option>
                                <option value="Dorm">{t('common.dorm')}</option>
                            </select>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" isLoading={addingRoom} className="w-full sm:w-auto">{t('pgs.save_room')}</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content Area */}
            {!hasRooms ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <Home size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{t('pgs.start_building')}</h3>
                    <p className="text-slate-500 mt-2">{t('pgs.add_rooms_beds_hint')}</p>
                </div>
            ) : !selectedRoomId ? (
                /* Layer 1: Room Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                    {pg.rooms?.sort((a, b) => a.room_number.localeCompare(b.room_number)).map((room: Room) => (
                        <div
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-7 hover:shadow-2xl hover:border-indigo-200 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {/* Room Actions */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingRoomId(room.id);
                                    setEditRoomNumber(room.room_number);
                                    setEditFloor(String(room.floor));
                                    setEditRoomType(room.type);
                                }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRoom(room.id);
                                }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="w-14 h-14 bg-slate-900/5 text-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all font-bold text-xl">
                                {room.room_number}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900">{t('pgs.room_number')} {room.room_number}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                <span className="font-semibold text-slate-400">{t(`common.${room.type.toLowerCase()}`)}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{t('pgs.floor')} {room.floor}</span>
                            </div>

                            <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-50">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-slate-900 leading-tight">{room.beds?.length || 0}</span>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{t('pgs.total_beds')}</span>
                                </div>
                                <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                    <ChevronLeft size={20} className="rotate-180" />
                                </div>
                            </div>

                            {/* Inline Edit Overlay */}
                            {editingRoomId === room.id && (
                                <div className="absolute inset-0 bg-white p-7 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Edit2 size={16} /> {t('pgs.edit_room')}
                                    </h4>
                                    <form onSubmit={(e) => { e.stopPropagation(); handleUpdateRoom(e, room.id); }} className="space-y-4">
                                        <Input label={t('pgs.room_number')} value={editRoomNumber} onChange={e => setEditRoomNumber(e.target.value)} required />
                                        <Input label={t('pgs.floor')} type="number" value={editFloor} onChange={e => setEditFloor(e.target.value)} />
                                        <div className="flex gap-2 pt-2">
                                            <Button type="submit" size="sm" className="flex-1">{t('common.save')}</Button>
                                            <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingRoomId(null); }}>{t('common.cancel')}</Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                /* Layer 2: Bed drilling view */
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    {selectedRoom && (
                        <div className="grid grid-cols-1 gap-8 relative">
                            {/* Room Edit Form Overlay for Layer 2 */}
                            {editingRoomId === selectedRoom.id && (
                                <div className="absolute inset-0 bg-white/95 backdrop-blur-md p-10 z-30 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-center border border-slate-200">
                                    <h4 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                        <Edit2 size={28} className="text-indigo-600" /> {t('pgs.edit_property')}
                                    </h4>
                                    <form onSubmit={(e) => handleUpdateRoom(e, selectedRoom.id)} className="space-y-6 max-w-xl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input label={t('pgs.room_number')} value={editRoomNumber} onChange={e => setEditRoomNumber(e.target.value)} required />
                                            <Input label={t('pgs.floor')} type="number" value={editFloor} onChange={e => setEditFloor(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">{t('pgs.room_type')}</label>
                                            <select
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
                                                value={editRoomType}
                                                onChange={e => setEditRoomType(e.target.value)}
                                            >
                                                <option value="Single">{t('common.single_sharing')}</option>
                                                <option value="Double">{t('common.double_sharing')}</option>
                                                <option value="Triple">{t('common.triple_sharing')}</option>
                                                <option value="Dorm">{t('common.dormitory')}</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <Button type="submit" size="lg" className="flex-1">{t('common.save')}</Button>
                                            <Button type="button" variant="ghost" size="lg" onClick={() => setEditingRoomId(null)}>{t('common.cancel')}</Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            {/* Selected Room Status Card */}
                            <div className="bg-gradient-to-br from-indigo-700 to-violet-800 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="text-5xl font-black tracking-tighter">{t('pgs.room_number')} {selectedRoom.room_number}</h3>
                                            <button
                                                onClick={() => {
                                                    setEditingRoomId(selectedRoom.id);
                                                    setEditRoomNumber(selectedRoom.room_number);
                                                    setEditFloor(String(selectedRoom.floor));
                                                    setEditRoomType(selectedRoom.type);
                                                }}
                                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
                                            >
                                                <Edit2 size={24} />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">{t(`common.${selectedRoom.type.toLowerCase()}`)} {t('pgs.sharing')}</span>
                                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">{t('pgs.floor')} {selectedRoom.floor}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 sm:gap-10 p-6 bg-black/10 backdrop-blur-xl rounded-[2rem] border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-white/50 text-[10px] uppercase tracking-widest font-black mb-1">{t('pgs.total_capacity')}</span>
                                            <span className="text-3xl font-black">{selectedRoom.beds?.length || 0}</span>
                                        </div>
                                        <div className="w-px bg-white/10 h-10 self-center"></div>
                                        <div className="flex flex-col">
                                            <span className="text-white/50 text-[10px] uppercase tracking-widest font-black mb-1">{t('pgs.occupied')}</span>
                                            <span className="text-3xl font-black text-emerald-400">{selectedRoom.beds?.filter(b => b.is_occupied).length || 0}</span>
                                        </div>
                                        <div className="w-px bg-white/10 h-10 self-center"></div>
                                        <div className="flex flex-col">
                                            <span className="text-white/50 text-[10px] uppercase tracking-widest font-black mb-1">{t('pgs.vacant')}</span>
                                            <span className="text-3xl font-black text-white">{selectedRoom.beds?.filter(b => !b.is_occupied).length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute right-[-2%] bottom-[-10%] opacity-[0.03] scale-[3] pointer-events-none group-hover:scale-[3.1] transition-transform duration-1000">
                                    <Home size={200} />
                                </div>
                            </div>

                            {/* Beds Grid / Management */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">{t('pgs.active_bed_inventory')}</h4>
                                    <Button size="sm" className="shadow-lg shadow-indigo-500/20" onClick={() => setAddingBedToRoomId(selectedRoomId)}>
                                        <Plus size={18} className="mr-2" /> {t('pgs.quick_add_bed')}
                                    </Button>
                                </div>

                                {/* Quick Add Form Overlay */}
                                {addingBedToRoomId === selectedRoomId && (
                                    <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                <Plus size={20} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900">{t('pgs.bed_configuration')}</h5>
                                                <p className="text-sm text-slate-500">{t('pgs.bed_configuration_hint')}</p>
                                            </div>
                                        </div>
                                        <form onSubmit={(e) => handleAddBed(e, selectedRoomId!)} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                                            <Input
                                                label={t('pgs.bed_number')}
                                                placeholder="e.g. A"
                                                value={bedNumber}
                                                onChange={e => setBedNumber(e.target.value)}
                                                required
                                            />
                                            <Input
                                                label={t('pgs.monthly_rent')}
                                                type="number"
                                                placeholder="5000"
                                                value={bedPrice}
                                                onChange={e => setBedPrice(e.target.value)}
                                                required
                                            />
                                            <div className="flex gap-2">
                                                <Button type="submit" isLoading={addingBed} className="flex-1">{t('pgs.create_bed')}</Button>
                                                <Button type="button" variant="ghost" onClick={() => setAddingBedToRoomId(null)}>{t('common.cancel')}</Button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {selectedRoom.beds && selectedRoom.beds.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {selectedRoom.beds.map((bed: Bed) => (
                                            <div
                                                key={bed.id}
                                                className={`bg-white rounded-[2rem] p-5 sm:p-8 border-2 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex flex-col gap-6 ${bed.is_occupied ? 'border-red-50' : 'border-emerald-50'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-black text-lg ${bed.is_occupied ? 'bg-red-50/50 border-red-100 text-red-700' : 'bg-emerald-50/50 border-emerald-100 text-emerald-700'}`}>
                                                            {bed.bed_number}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{t('pgs.bed_unit')}</div>
                                                            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">₹{bed.monthly_price}/{t('common.mo')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 items-center">
                                                        {!bed.is_occupied && (
                                                            <>
                                                                <button onClick={() => {
                                                                    setEditingBedId(bed.id);
                                                                    setEditBedNumber(bed.bed_number);
                                                                    setEditBedPrice(String(bed.monthly_price));
                                                                }} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-all">
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button onClick={() => handleDeleteBed(bed.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-2xl transition-all">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {editingBedId === bed.id ? (
                                                    <form onSubmit={(e) => handleUpdateBed(e, bed.id)} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                                        <Input label={t('pgs.bed_number')} value={editBedNumber} onChange={e => setEditBedNumber(e.target.value)} required />
                                                        <Input label={t('pgs.monthly_rent')} type="number" value={editBedPrice} onChange={e => setEditBedPrice(e.target.value)} required />
                                                        <div className="flex gap-2">
                                                            <Button type="submit" size="sm" className="flex-1">{t('common.save')}</Button>
                                                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingBedId(null)}>{t('common.cancel')}</Button>
                                                        </div>
                                                    </form>
                                                ) : bed.is_occupied && bed.tenant ? (
                                                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/20 animate-in zoom-in-95 duration-300">
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                                                                <UserIcon size={20} className="text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-lg">{bed.tenant.name}</div>
                                                                <div className="text-white/50 text-[10px] tracking-widest uppercase font-black">{bed.tenant.phone}</div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-0 rounded-2xl h-14 font-black shadow-lg shadow-emerald-500/20"
                                                            onClick={() => handleOpenRentModal(bed)}
                                                        >
                                                            <Banknote size={20} className="mr-3" /> {t('pgs.receive_rent')}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 flex-1">
                                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                                                            <Plus size={24} />
                                                        </div>
                                                        <div className="text-emerald-700 font-black text-sm uppercase tracking-widest">{t('pgs.vacant')}</div>
                                                        <Link to="/tenants" className="text-xs text-indigo-600 font-bold mt-2 hover:indigo-500 transition-colors">{t('tenants.assign_now')} →</Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-medium italic">{t('pgs.empty_room_hint')}</p>
                                        <Button variant="ghost" className="mt-4 text-indigo-600 hover:bg-indigo-50 font-bold" onClick={() => setAddingBedToRoomId(selectedRoomId)}>
                                            <Plus size={20} className="mr-2" /> {t('pgs.create_bed')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rent Collection Modal */}
            {showRentModal && selectedTenantForRent && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl max-w-md w-full p-6 sm:p-10 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-y-auto max-h-[90vh]">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-6 shadow-inner">
                                <Banknote className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('pgs.receive_rent')}</h2>
                            <p className="text-slate-500 mt-2 font-medium">{t('pgs.processing_payment')} <span className="text-indigo-600 font-bold">{selectedTenantForRent.name}</span></p>
                        </div>

                        <form onSubmit={handleReceiveRent} className="space-y-6">
                            <Input
                                label={t('pgs.confirmed_amount')}
                                type="number"
                                value={rentAmount}
                                onChange={e => setRentAmount(e.target.value)}
                                required
                                className="h-14 text-lg font-bold"
                            />

                            <div className="pt-4 flex flex-col gap-3">
                                <Button type="submit" isLoading={submittingRent} className="w-full h-16 rounded-[1.25rem] bg-emerald-600 hover:bg-emerald-700 text-lg font-black shadow-xl shadow-emerald-500/20">
                                    {t('pgs.confirm_payment')}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setShowRentModal(false)} className="w-full h-14 font-bold text-slate-500">
                                    {t('pgs.discard_entry')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};
