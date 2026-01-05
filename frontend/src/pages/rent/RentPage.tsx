import { useEffect, useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import type { RentRecord, Tenant } from '../../types';

export const RentPage = () => {
    const [rents, setRents] = useState<(RentRecord & { tenant?: Tenant })[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchRents();
    }, []);

    const fetchRents = async () => {
        try {
            // Fetch rents
            const rentsRes = await api.get('/rents/');
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

    const generateRents = async () => {
        setGenerating(true);
        try {
            await api.post('/rents/generate');
            await fetchRents();
        } catch (error) {
            console.error('Failed to generate rents:', error);
        } finally {
            setGenerating(false);
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Rent Management</h1>
                <Button onClick={generateRents} isLoading={generating}>
                    <DollarSign size={20} className="mr-2" />
                    Generate Monthly Rent
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 uppercase">Total Pending</h3>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                        ₹{rents.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount_due, 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 uppercase">Collected this Month</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        ₹{rents.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount_due, 0)}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-700">Rent Records</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-slate-500 text-sm">
                                <th className="p-4 font-medium">Tenant</th>
                                <th className="p-4 font-medium">Month</th>
                                <th className="p-4 font-medium">Amount</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr>
                            ) : rents.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No rent records found.</td></tr>
                            ) : (
                                rents.sort((a, b) => b.id - a.id).map((rent) => (
                                    <tr key={rent.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-900">
                                            {rent.tenant?.name || `Tenant #${rent.tenant_id}`}
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {new Date(rent.month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="p-4 font-medium">₹{rent.amount_due}</td>
                                        <td className="p-4">
                                            {rent.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                                                    <CheckCircle size={12} /> Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-medium">
                                                    <AlertCircle size={12} /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {rent.status === 'pending' && (
                                                <Button size="sm" variant="outline" onClick={() => markPaid(rent.id)}>
                                                    Mark Paid
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
