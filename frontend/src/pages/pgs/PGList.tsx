import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Building, Edit2, Trash2 } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import type { PG } from '../../types';

import { useLanguage } from '../../hooks/useLanguage';

export const PGList = () => {
    const { t } = useLanguage();
    const [pgs, setPgs] = useState<PG[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedPG, setSelectedPG] = useState<PG | null>(null);

    // New PG Form State
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newCity, setNewCity] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit state
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editCity, setEditCity] = useState('');

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

    const handleDeletePG = async (e: React.MouseEvent, pgId: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(t('common.confirm_delete_pg', { defaultValue: 'Are you sure you want to delete this property? All rooms and beds will also be deleted.' }))) return;
        try {
            await api.delete(`/pgs/${pgId}`);
            fetchPGs();
        } catch (error) {
            console.error('Delete failed', error);
            alert(t('common.failed_delete', { defaultValue: 'Failed to delete property' }));
        }
    };

    const handleEditPG = (e: React.MouseEvent, pg: PG) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedPG(pg);
        setEditName(pg.name);
        setEditAddress(pg.address || '');
        setEditCity(pg.city || '');
        setShowEditForm(true);
    };

    const handleUpdatePG = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPG) return;
        setSubmitting(true);
        try {
            await api.put(`/pgs/${selectedPG.id}`, {
                name: editName,
                address: editAddress,
                city: editCity
            });
            fetchPGs();
            setShowEditForm(false);
        } catch (error) {
            console.error('Update failed', error);
            alert(t('common.failed_update', { defaultValue: 'Failed to update property' }));
        } finally {
            setSubmitting(true);
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">{t('pgs.title')}</h1>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus size={20} className="mr-2" />
                    {t('pgs.add_new')}
                </Button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 animate-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">{t('pgs.add_new')}</h3>
                    <form onSubmit={handleAddPG} className="space-y-4">
                        <Input
                            label={t('pgs.pg_name')}
                            placeholder="e.g. Sunrise Residency"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('pgs.address')}
                                placeholder="Street address"
                                value={newAddress}
                                onChange={e => setNewAddress(e.target.value)}
                            />
                            <Input
                                label={t('pgs.city')}
                                placeholder="e.g. Pune"
                                value={newCity}
                                onChange={e => setNewCity(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" isLoading={submitting}>
                                {t('common.save')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {showEditForm && selectedPG && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 animate-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">{t('pgs.edit_property')}</h3>
                    <form onSubmit={handleUpdatePG} className="space-y-4">
                        <Input
                            label={t('pgs.pg_name')}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('pgs.address')}
                                value={editAddress}
                                onChange={e => setEditAddress(e.target.value)}
                            />
                            <Input
                                label={t('pgs.city')}
                                value={editCity}
                                onChange={e => setEditCity(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowEditForm(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" isLoading={submitting}>
                                {t('common.save')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-slate-500">{t('common.loading')}</p>
                ) : pgs.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Building className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-slate-500">{t('pgs.no_pgs')}</p>
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
                                    {t('tenants.id')}: {pg.id}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                                {pg.name}
                            </h3>
                            <div className="flex items-center text-slate-500 text-sm mb-4">
                                <MapPin size={16} className="mr-1" />
                                {pg.city || t('pgs.no_city', { defaultValue: 'No city' })}
                            </div>
                            <div className="flex gap-2 justify-end mb-4 relative z-10">
                                <button
                                    onClick={(e) => handleEditPG(e, pg)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title={t('common.edit') || "Edit PG"}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => handleDeletePG(e, pg.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title={t('common.delete') || "Delete PG"}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                <span className="text-sm text-slate-500">{t('pgs.view_rooms_beds')}</span>
                                <span className="text-primary text-sm font-medium">→</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </Layout>
    );
};
