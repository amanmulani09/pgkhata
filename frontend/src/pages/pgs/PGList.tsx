import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Building } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import type { PG } from '../../types';

export const PGList = () => {
    const [pgs, setPgs] = useState<PG[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // New PG Form State
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newCity, setNewCity] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPGs();
    }, []);

    const fetchPGs = async () => {
        try {
            const response = await api.get('/pgs/');
            setPgs(response.data);
        } catch (error) {
            console.error('Failed to fetch PGs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPG = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name: newName,
                address: newAddress,
                city: newCity
            };
            const response = await api.post('/pgs/', payload);
            setPgs([...pgs, response.data]);
            setShowAddForm(false);
            setNewName('');
            setNewAddress('');
            setNewCity('');
        } catch (error) {
            console.error('Failed to create PG:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">My PGs</h1>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus size={20} className="mr-2" />
                    Add PG
                </Button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 animate-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">Add New Property</h3>
                    <form onSubmit={handleAddPG} className="space-y-4">
                        <Input
                            label="PG Name"
                            placeholder="e.g. Sunrise Residency"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Address"
                                placeholder="Street address"
                                value={newAddress}
                                onChange={e => setNewAddress(e.target.value)}
                            />
                            <Input
                                label="City"
                                placeholder="e.g. Pune"
                                value={newCity}
                                onChange={e => setNewCity(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={submitting}>
                                Create Application
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-slate-500">Loading properties...</p>
                ) : pgs.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Building className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-slate-500">No PGs found. Add your first one above!</p>
                    </div>
                ) : (
                    pgs.map(pg => (
                        <Link
                            key={pg.id}
                            to={`/pgs/${pg.id}`}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Building size={24} />
                                </div>
                                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                    ID: {pg.id}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                                {pg.name}
                            </h3>
                            <div className="flex items-center text-slate-500 text-sm mb-4">
                                <MapPin size={16} className="mr-1" />
                                {pg.city || 'No city'}
                            </div>
                            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                <span className="text-sm text-slate-500">View Rooms & Beds</span>
                                <span className="text-primary text-sm font-medium">→</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </Layout>
    );
};
