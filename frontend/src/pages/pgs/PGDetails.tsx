import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Plus, Home } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import type { PG, Room, Bed } from '../../types';

export const PGDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [pg, setPg] = useState<PG | null>(null);
    const [loading, setLoading] = useState(true);

    // Add Room State
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [roomNumber, setRoomNumber] = useState('');
    const [floor, setFloor] = useState('');
    const [roomType, setRoomType] = useState('Double');
    const [addingRoom, setAddingRoom] = useState(false);

    // Add Bed State (Simple: Add to specific room)
    const [addingBedToRoomId, setAddingBedToRoomId] = useState<number | null>(null);
    const [bedNumber, setBedNumber] = useState('');
    const [bedPrice, setBedPrice] = useState('');
    const [addingBed, setAddingBed] = useState(false);

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
            await fetchPGDetails(); // Refresh to show new room
            setShowAddRoom(false);
            setRoomNumber('');
            setFloor('');
        } catch (error) {
            console.error("Failed to add room", error);
        } finally {
            setAddingRoom(false);
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

    if (loading) return <Layout><div>Loading...</div></Layout>;
    if (!pg) return <Layout><div>PG not found</div></Layout>;

    const hasRooms = pg.rooms && pg.rooms.length > 0;

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-6">
                <Link to="/pgs" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{pg.name}</h1>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                        <Home size={14} /> {pg.address}, {pg.city}
                    </p>
                </div>
            </div>

            <div className="mb-6">
                <Button onClick={() => setShowAddRoom(!showAddRoom)} variant={showAddRoom ? "secondary" : "primary"}>
                    {showAddRoom ? "Cancel" : "Add Room"}
                </Button>
            </div>

            {showAddRoom && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 animate-in slide-in-from-top-4 max-w-lg">
                    <h3 className="font-semibold mb-4">Add Variable Room</h3>
                    <form onSubmit={handleAddRoom} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Room Number"
                                placeholder="e.g. 101"
                                value={roomNumber}
                                onChange={e => setRoomNumber(e.target.value)}
                                required
                            />
                            <Input
                                label="Floor"
                                type="number"
                                placeholder="0"
                                value={floor}
                                onChange={e => setFloor(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                value={roomType}
                                onChange={e => setRoomType(e.target.value)}
                            >
                                <option value="Single">Single</option>
                                <option value="Double">Double</option>
                                <option value="Triple">Triple</option>
                                <option value="Dorm">Dormitory</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="submit" isLoading={addingRoom}>Save Room</Button>
                        </div>
                    </form>
                </div>
            )}

            {!hasRooms ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400">No rooms added yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Sort rooms by number just in case */}
                    {pg.rooms?.sort((a, b) => a.room_number.localeCompare(b.room_number)).map((room: Room) => (
                        <div key={room.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Room {room.room_number}</h3>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{room.type} • Floor {room.floor}</span>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setAddingBedToRoomId(addingBedToRoomId === room.id ? null : room.id)}>
                                    <Plus size={16} className="mr-1" /> Add Bed
                                </Button>
                            </div>

                            {/* Add Bed Form for this Room */}
                            {addingBedToRoomId === room.id && (
                                <div className="p-4 bg-blue-50 border-b border-blue-100">
                                    <form onSubmit={(e) => handleAddBed(e, room.id)} className="flex gap-4 items-end">
                                        <Input
                                            label="Bed Number/ID"
                                            placeholder="A"
                                            value={bedNumber}
                                            onChange={e => setBedNumber(e.target.value)}
                                            required
                                            className="bg-white"
                                        />
                                        <Input
                                            label="Monthly Rent (₹)"
                                            type="number"
                                            placeholder="5000"
                                            value={bedPrice}
                                            onChange={e => setBedPrice(e.target.value)}
                                            required
                                            className="bg-white"
                                        />
                                        <Button type="submit" isLoading={addingBed} size="md" className="mb-[1px]">Save</Button>
                                    </form>
                                </div>
                            )}

                            <div className="p-6">
                                {room.beds && room.beds.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {room.beds.map((bed: Bed) => (
                                            <div key={bed.id} className={`border rounded-lg p-4 flex flex-col gap-2 ${bed.is_occupied ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-slate-700">Bed {bed.bed_number}</span>
                                                    <span className={`w-2 h-2 rounded-full ${bed.is_occupied ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    ₹{bed.monthly_price}/mo
                                                </div>
                                                <div className={`text-xs font-medium px-2 py-1 rounded w-fit ${bed.is_occupied ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                                    {bed.is_occupied ? 'Occupied' : 'Vacant'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No beds in this room.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};
