import { useEffect, useState } from 'react';
import { CheckCircle, MessageSquare, Plus } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import type { Complaint, Tenant } from '../../types';

export const ComplaintsPage = () => {
    const [complaints, setComplaints] = useState<(Complaint & { tenant_name?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTenantId, setSelectedTenantId] = useState('');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [complaintsRes, tenantsRes] = await Promise.all([
                api.get('/complaints/'),
                api.get('/tenants/')
            ]);

            const tenantMap = new Map(tenantsRes.data.map((t: Tenant) => [t.id, t.name]));
            const complaintsWithNames = complaintsRes.data.map((c: Complaint) => ({
                ...c,
                tenant_name: tenantMap.get(c.tenant_id) || 'Unknown Tenant'
            }));

            setComplaints(complaintsWithNames);
            setTenants(tenantsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/complaints/', {
                title,
                description,
                status: 'open'
            }, {
                params: { tenant_id: selectedTenantId }
            });
            await fetchData();
            setShowAddModal(false);
            setTitle('');
            setDescription('');
            setSelectedTenantId('');
        } catch (error) {
            console.error('Failed to create complaint:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const resolveComplaint = async (id: number) => {
        try {
            await api.put(`/complaints/${id}/resolve`);
            fetchData();
        } catch (error) {
            console.error('Failed to resolve complaint:', error);
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus size={20} className="mr-2" />
                    Log Complaint
                </Button>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 sm:p-10 animate-in zoom-in-95 duration-200 border border-slate-100 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Log New Complaint</h2>
                        <form onSubmit={handleAddComplaint} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={selectedTenantId}
                                    onChange={e => setSelectedTenantId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Tenant --</option>
                                    {tenants.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Title"
                                placeholder="e.g. Broken Fan"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Describe the issue..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={submitting}>
                                    Submit Ticket
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <p className="text-center text-slate-500 py-8">Loading complaints...</p>
                ) : complaints.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-slate-500">No complaints found. Ideally, that's good!</p>
                    </div>
                ) : (
                    complaints.sort((a, b) => b.id - a.id).map(complaint => (
                        <div key={complaint.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${complaint.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                        {complaint.status}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        Raised by {complaint.tenant_name} • {new Date(complaint.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg">{complaint.title}</h3>
                                {complaint.description && (
                                    <p className="text-slate-600 mt-1">{complaint.description}</p>
                                )}
                            </div>

                            <div className="flex items-center">
                                {complaint.status === 'open' ? (
                                    <Button variant="outline" size="sm" onClick={() => resolveComplaint(complaint.id)}>
                                        <CheckCircle size={16} className="mr-2" />
                                        Mark Resolved
                                    </Button>
                                ) : (
                                    <div className="flex items-center text-green-600 text-sm font-medium px-4 py-2 bg-green-50 rounded-lg">
                                        <CheckCircle size={16} className="mr-2" />
                                        Resolved {complaint.resolved_at ? `on ${new Date(complaint.resolved_at).toLocaleDateString()}` : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
};
