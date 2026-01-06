import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import type { RentRecord, Tenant } from '../../types';

import { useLanguage } from '../../hooks/useLanguage';

export const RentPage = () => {
    const { t } = useLanguage();
    const [rents, setRents] = useState<(RentRecord & { tenant?: Tenant })[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));

    useEffect(() => {
        fetchRents();
    }, [selectedMonth]);

    const fetchRents = async () => {
        try {
            setLoading(true);
            // Fetch rents
            const rentsRes = await api.get('/rents/', {
                params: { curr_month: `${selectedMonth}-01` }
            });
            // We need tenant details for names. 
            // In a better API design, the backend would return nested tenant info or we would fetch tenants and map.
            // For MVP, let's just fetch all tenants and map them.
            const tenantsRes = await api.get('/tenants/');
            const tenantsMap = new Map(tenantsRes.data.map((t: Tenant) => [t.id, t]));

            const rentsWithTenant = rentsRes.data.map((r: RentRecord) => ({
                ...r,
                tenant: tenantsMap.get(r.tenant_id)
            }));

            setRents(rentsWithTenant);
        } catch (error) {
            console.error('Failed to fetch rents:', error);
        } finally {
            setLoading(false);
        }
    };

    const markPaid = async (rentId: number) => {
        try {
            await api.put(`/rents/${rentId}`, {
                status: 'paid',
                payment_date: new Date().toISOString().split('T')[0]
            });
            fetchRents();
        } catch (error) {
            console.error('Failed to update rent:', error);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('rent.title', { defaultValue: 'Rent Management' })}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('rent.subtitle', { defaultValue: 'Track and collect rent from all your tenants.' })}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <Calendar size={18} className="text-slate-400 ml-1" />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="text-sm font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer pr-2"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('rent.total_rents', { defaultValue: 'Total Rents' })}</h3>
                    <p className="text-3xl font-black text-slate-900 mt-2">
                        ₹{rents.reduce((sum: number, r) => sum + r.amount_due, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-b-emerald-500 border-b-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider text-emerald-600">{t('rent.received_rent', { defaultValue: 'Received Rent' })}</h3>
                    <p className="text-3xl font-black text-emerald-600 mt-2">
                        ₹{rents.reduce((sum: number, r) => sum + (r.status === 'paid' ? (r.amount_paid || r.amount_due) : (r.amount_paid || 0)), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-b-amber-500 border-b-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider text-amber-600">{t('rent.pending_rent', { defaultValue: 'Pending Rent' })}</h3>
                    <p className="text-3xl font-black text-amber-600 mt-2">
                        ₹{rents.filter(r => r.status !== 'paid').reduce((sum: number, r) => sum + (r.amount_due - (r.amount_paid || 0)), 0).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-700">{t('rent.records', { defaultValue: 'Rent Records' })}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-slate-500 text-sm">
                                <th className="p-4 font-medium">{t('common.tenant', { defaultValue: 'Tenant' })}</th>
                                <th className="p-4 font-medium">{t('common.month', { defaultValue: 'Month' })}</th>
                                <th className="p-4 font-medium">{t('common.amount', { defaultValue: 'Amount' })}</th>
                                <th className="p-4 font-medium">{t('common.status', { defaultValue: 'Status' })}</th>
                                <th className="p-4 font-medium">{t('common.actions', { defaultValue: 'Action' })}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center">{t('common.loading')}</td></tr>
                            ) : rents.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">{t('rent.no_records', { defaultValue: 'No rent records found.' })}</td></tr>
                            ) : (
                                rents.sort((a, b) => b.id - a.id).map((rent) => (
                                    <tr key={rent.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-900">
                                            {rent.tenant?.name || `${t('common.tenant')} #${rent.tenant_id}`}
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {new Date(rent.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 font-medium">₹{rent.amount_due}</td>
                                        <td className="p-4">
                                            {rent.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                                                    <CheckCircle size={12} /> {t('common.paid')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium">
                                                    <AlertCircle size={12} /> {t('common.pending')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {rent.status === 'pending' && (
                                                <Button size="sm" variant="outline" onClick={() => markPaid(rent.id)}>
                                                    {t('rent.mark_paid', { defaultValue: 'Mark Paid' })}
                                                </Button>
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
