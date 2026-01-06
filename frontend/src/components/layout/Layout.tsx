import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, BedDouble, FileText, LogOut, Languages, WifiOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../hooks/useLanguage';
import { useState, useEffect } from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { logout } = useAuth();
    const location = useLocation();
    const { t, i18n, languages, changeLanguage } = useLanguage();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Update html lang attribute for SEO and accessibility
        document.documentElement.lang = i18n.language;

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [i18n.language]);

    const navItems = [
        { icon: Home, label: t('nav.dashboard'), path: '/dashboard' },
        { icon: BedDouble, label: t('nav.pgs'), path: '/pgs' },
        { icon: Users, label: t('nav.tenants'), path: '/tenants' },
        { icon: FileText, label: t('nav.rent'), path: '/rent' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
            {isOffline && (
                <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 z-[100] animate-in slide-in-from-top duration-300">
                    <WifiOff size={14} />
                    <span>You are currently offline. Changes will be synced when you go online.</span>
                </div>
            )}
            {/* Mobile Bottom Navigation (Visible on small screens) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden flex justify-around p-3 pb-safe">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        aria-label={item.label}
                        className={cn(
                            "flex flex-col items-center text-xs gap-1",
                            location.pathname === item.path ? "text-indigo-600 font-medium" : "text-slate-600 hover:text-indigo-500 transition-colors"
                        )}
                    >
                        <item.icon size={22} aria-hidden="true" />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-4 h-full z-10 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3 mb-8 px-2 py-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20 transform rotate-3">
                        PK
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">PGKhata</h1>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                aria-label={item.label}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 shadow-sm font-semibold"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                                )}
                            >
                                <item.icon size={20} className={cn("transition-colors", isActive ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700")} />
                                <span className="relative z-10">{item.label}</span>
                                {!isActive && <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity z-0" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Language Switcher in Sidebar */}
                <div className="mt-8 px-2 mb-4">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                        <Languages size={14} aria-hidden="true" />
                        {t('common.language')}
                    </div>
                    <select
                        value={i18n.language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        aria-label={t('common.language')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={logout}
                    aria-label={t('nav.logout')}
                    className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all group mt-auto"
                >
                    <LogOut size={20} className="group-hover:scale-110 transition-transform text-slate-500 group-hover:text-red-500" />
                    {t('nav.logout')}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-28 md:pb-8 relative">
                {/* Mobile Header */}
                <div className="md:hidden flex justify-between items-center mb-6 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 transform rotate-3">
                            PK
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">PGKhata</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={i18n.language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            aria-label={t('common.language')}
                            className="bg-slate-100 border-none rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none transition-all cursor-pointer"
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={logout}
                            aria-label={t('nav.logout')}
                            className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
};
