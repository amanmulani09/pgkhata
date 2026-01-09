import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    User as UserIcon,
    Phone,
    Mail,
    CreditCard,
    Home,
    Banknote,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowUpRight
} from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import type { Tenant, RentRecord } from '../../types';

import { useLanguage } from '../../hooks/useLanguage';

export const TenantDetails = () => {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchTenantDetails();
    }, [id]);

    const fetchTenantDetails = async () => {
        try {
            const response = await api.get(`/tenants/${id}`);
            setTenant(response.data);
        } catch (error) {
            console.error('Failed to fetch tenant details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">{t('common.loading', { defaultValue: 'Fetching tenant records...' })}</p>
                </div>
            </Layout>
        );
    }

    if (!tenant) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-slate-900">{t('common.not_found', { defaultValue: 'Tenant not found' })}</h2>
                    <Button onClick={() => navigate('/tenants')} className="mt-4">{t('common.back', { defaultValue: 'Back to Tenants' })}</Button>
                </div>
            </Layout>
        );
    }

    const recentRents = tenant.rent_records?.sort((a, b) =>
        new Date(b.month).getTime() - new Date(a.month).getTime()
    ).slice(0, 5) || [];

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/tenants')}
                    className="mb-4 -ml-4 text-slate-500 hover:text-indigo-600"
                >
                    <ChevronLeft size={20} className="mr-1" /> {t('common.back', { defaultValue: 'Back to Tenants' })}
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-200">
                            {tenant.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{tenant.name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${tenant.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                    {tenant.status === 'active' ? t('common.active', { defaultValue: 'Active' }) : t('common.checked_out', { defaultValue: 'Checked Out' })}
                                </span>
                                <span className="text-slate-400 text-sm font-medium">{t('tenants.joined', { defaultValue: 'Joined' })} {new Date(tenant.check_in_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => window.print()}>{t('tenants.print_summary', { defaultValue: 'Print Summary' })}</Button>
                        <Button onClick={() => navigate(`/rent`)}>{t('rent.manage_rent', { defaultValue: 'Manage Rent' })}</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Identity & Contact Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                            <UserIcon className="text-indigo-600" size={24} /> {t('tenants.personal_info', { defaultValue: 'Personal Information' })}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">{t('tenants.phone_number')}</label>
                                <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Phone size={18} />
                                    </div>
                                    {tenant.phone}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">{t('tenants.email_address', { defaultValue: 'Email Address' })}</label>
                                <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    {tenant.email || t('common.not_provided', { defaultValue: 'Not provided' })}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">{t('tenants.identity_proof', { defaultValue: 'Identity Proof (Aadhar/ID)' })}</label>
                                <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <CreditCard size={18} />
                                    </div>
                                    {tenant.id_proof || t('common.not_uploaded', { defaultValue: 'Not uploaded' })}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400">{t('tenants.security_deposit', { defaultValue: 'Security Deposit' })}</label>
                                <div className="flex items-center gap-3 text-indigo-600 font-black text-lg">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                                        <Banknote size={18} />
                                    </div>
                                    ₹{tenant.security_deposit.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="text-indigo-600" size={24} /> {t('common.recent_transactions', { defaultValue: 'Recent Transactions' })}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/rent')}>{t('common.view_all', { defaultValue: 'View All' })}</Button>
                        </div>

                        {recentRents.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium">{t('tenants.no_records', { defaultValue: 'No rent records found for this tenant.' })}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentRents.map((rent: RentRecord) => (
                                    <div key={rent.id} className="flex items-center justify-between p-5 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${rent.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {rent.status === 'paid' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">
                                                    {new Date(rent.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">
                                                    {t('common.status', { defaultValue: 'Status' })}: <span className="uppercase tracking-tighter">{rent.status === 'paid' ? t('rent.paid') : t('rent.pending')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black text-slate-900">₹{rent.amount_due.toLocaleString()}</div>
                                            {rent.payment_date && (
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{t('rent.paid_on', { defaultValue: 'Paid on' })} {new Date(rent.payment_date).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Allocation & Summary */}
                <div className="space-y-8">
                    {/* Allocation Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-8">{t('tenants.current_allocation', { defaultValue: 'Current Allocation' })}</h3>

                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white/10">
                                        <Home size={28} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{t('pgs.pg_name')}</div>
                                        <div className="text-xl font-bold truncate max-w-[180px]">{tenant.pg?.name || t('common.loading')}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{t('pgs.room_number', { defaultValue: 'Room No.' })}</div>
                                        <div className="text-2xl font-black">{tenant.bed?.room?.room_number || '--'}</div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{t('pgs.bed_number', { defaultValue: 'Bed No.' })}</div>
                                        <div className="text-2xl font-black">{tenant.bed?.bed_number || '--'}</div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">{t('pgs.monthly_rent')}</div>
                                    <div className="flex items-end gap-1 font-black">
                                        <span className="text-3xl">₹{(tenant.bed?.monthly_price || 0).toLocaleString()}</span>
                                        <span className="text-xs text-white/60 mb-1">/ {t('common.mo', { defaultValue: 'Month' })}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full mt-8 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                                onClick={() => navigate(`/pgs/${tenant.pg_id}`)}
                            >
                                {t('tenants.view_allocation', { defaultValue: 'View Allocation' })} <ArrowUpRight size={18} className="ml-2" />
                            </Button>
                        </div>

                        {/* Decorative background icon */}
                        <div className="absolute -right-10 -bottom-10 text-white/5 pointer-events-none">
                            <Home size={200} />
                        </div>
                    </div>

                    {/* Timeline Summary */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Clock className="text-indigo-600" size={24} /> {t('tenants.stay_timeline', { defaultValue: 'Stay Timeline' })}
                        </h3>
                        <div className="relative pl-8 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            <div className="relative">
                                <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-indigo-500 z-10"></div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('tenants.check_in_date')}</div>
                                    <div className="font-bold text-slate-900">{new Date(tenant.check_in_date).toDateString()}</div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className={`absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-white border-4 z-10 ${tenant.status === 'checked_out' ? 'border-red-500' : 'border-slate-200'
                                    }`}></div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.status', { defaultValue: 'Current Status' })}</div>
                                    <div className="font-bold text-slate-900 capitalize">{tenant.status === 'active' ? t('common.active') : t('common.checked_out')}</div>
                                    {tenant.check_out_date && (
                                        <div className="text-xs text-slate-500 mt-1">{t('tenants.checked_out_on', { defaultValue: 'Checked out on' })} {new Date(tenant.check_out_date).toDateString()}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
