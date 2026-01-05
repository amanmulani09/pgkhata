import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import type { PG } from '../../types';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Building2, Users, IndianRupee, ArrowRight, MapPin } from 'lucide-react';

export const Dashboard = () => {
    const { user } = useAuth();
    const [pgs, setPgs] = useState<PG[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pgRes = await api.get('/pgs/');
                setPgs(pgRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <Layout>
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="mb-8 animate-fade-in relative z-0">
                <div className="absolute top-0 right-0 -z-10 opacity-10">
                    <Building2 size={200} className="text-indigo-500" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">{user?.full_name || 'Owner'}</span> 👋
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Here's what's happening in your properties today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-indigo-50 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                                <Building2 size={20} />
                            </div>
                            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total PGs</h3>
                        </div>
                        <p className="text-4xl font-bold text-slate-900 mt-2">{pgs.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-50 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100/50 rounded-lg text-emerald-600">
                                <Users size={20} />
                            </div>
                            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Occupancy</h3>
                        </div>
                        <p className="text-4xl font-bold text-slate-900 mt-2">--%</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-amber-50 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-100/50 rounded-lg text-amber-600">
                                <IndianRupee size={20} />
                            </div>
                            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Pending Rent</h3>
                        </div>
                        <p className="text-4xl font-bold text-amber-600 mt-2">₹ --</p>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Building2 size={24} className="text-indigo-600" />
                Your Properties
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {pgs.map((pg, index) => (
                    <Link
                        key={pg.id}
                        to={`/pgs/${pg.id}`}
                        className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group flex flex-col"
                        style={{ animationDelay: `${0.1 * index}s` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Building2 size={24} />
                            </div>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                                ID: {pg.id}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                            {pg.name}
                        </h3>

                        <div className="flex items-center text-slate-500 text-sm mb-6">
                            <MapPin size={16} className="mr-1.5 text-indigo-400" />
                            {pg.address}, {pg.city}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-500 group-hover:text-slate-900 transition-colors">View Details</span>
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </Link>
                ))}

                {pgs.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Building2 size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No Properties Found</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by adding your first PG property to the system.</p>
                        <Link to="/pgs" className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all">
                            Add Property
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    );
};
