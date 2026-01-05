import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, BedDouble, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Dashboard', path: '/' },
        { icon: BedDouble, label: 'PGs', path: '/pgs' },
        { icon: Users, label: 'Tenants', path: '/tenants' },
        { icon: FileText, label: 'Rent', path: '/rent' },
    ];

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Mobile Bottom Navigation (Visible on small screens) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden flex justify-around p-3">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex flex-col items-center text-xs gap-1",
                            location.pathname === item.path ? "text-primary font-medium" : "text-slate-500"
                        )}
                    >
                        <item.icon size={24} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* Desktop Sidebar (Hidden on small screens) */}
            <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-4 fixed left-0 top-0 h-full z-10 shadow-sm">
                <div className="flex items-center gap-3 mb-8 px-2 py-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20 transform rotate-3">
                        PK
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">PGKhata</h1>
                </div>

                <nav className="flex-1 space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 shadow-sm font-semibold"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-white"
                                )}
                            >
                                <item.icon size={20} className={cn("transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                                <span className="relative z-10">{item.label}</span>
                                {!isActive && <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity z-0" />}
                            </Link>
                        );
                    })}
                </nav>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all mt-auto group"
                >
                    <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8 md:ml-64">
                <div className="md:hidden flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-primary">PGKhata</h1>
                    <button onClick={logout} className="p-2 text-slate-600"><LogOut size={20} /></button>
                </div>
                {children}
            </main>
        </div>
    );
};
