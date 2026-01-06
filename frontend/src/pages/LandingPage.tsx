import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    Building2,
    Users,
    CreditCard,
    ShieldCheck,
    BarChart3,
    MessageSquare,
    ArrowRight,
    ChevronRight,
    Zap,
    CheckCircle2,
    X,
    MessageCircle,
    Languages
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../hooks/useLanguage';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { t, i18n, languages, changeLanguage } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '+91 ',
        pgName: '',
        city: ''
    });

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            setIsModalOpen(true);
        }
    };

    const handleWhatsAppSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const message = `Hello! I'm interested in PGKhata.\n\n*Details:*\nName: ${formData.name}\nPhone: ${formData.phone}\nPG Name: ${formData.pgName}\nCity: ${formData.city}\n\nPlease help me get started!`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/91738617999?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        setIsModalOpen(false);
    };

    const features = [
        {
            icon: <Building2 className="w-6 h-6" />,
            title: "PG Management",
            description: "Easily organize your properties, rooms, and beds in one central dashboard."
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: "Tenant Records",
            description: "Maintain comprehensive tenant profiles, ID proofs, and documentation digitally."
        },
        {
            icon: <CreditCard className="w-6 h-6" />,
            title: "Rent Tracking",
            description: "Automated rent status tracking. Never lose track of who's paid and who's pending."
        },
        {
            icon: <MessageSquare className="w-6 h-6" />,
            title: "Issue Resolution",
            description: "Streamlined complaint management to keep your tenants happy and stay informed."
        }
    ];

    const stats = [
        { label: "Active Owners", value: "500+" },
        { label: "Tenants Managed", value: "10k+" },
        { label: "Cities", value: "20+" },
        { label: "Uptime", value: "99.9%" }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Building2 className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            PGKhata
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">{t('nav.features')}</a>
                        <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">{t('nav.how_it_works')}</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                            <Languages size={14} className="text-slate-500" aria-hidden="true" />
                            <select
                                value={i18n.language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                aria-label={t('common.language')}
                                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                                ))}
                            </select>
                        </div>
                        <Button
                            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                            variant="primary"
                            className="rounded-full px-6 h-10 text-sm font-semibold whitespace-nowrap"
                        >
                            {isAuthenticated ? t('nav.dashboard') : t('nav.login')}
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50 z-0"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-violet-50 rounded-full blur-3xl opacity-50 z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-6 animate-fade-in">
                        <Zap className="w-3 h-3 fill-indigo-700" />
                        <span>SMART PG MANAGEMENT</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        {t('hero.title')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t('hero.subtitle')}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg lg:text-xl text-slate-600 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        {t('hero.description')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <Button
                            onClick={handleGetStarted}
                            className="w-full sm:w-auto px-8 h-14 text-lg rounded-2xl shadow-xl shadow-indigo-200"
                            aria-label={isAuthenticated ? t('common.go_to_dashboard') : t('common.get_started')}
                        >
                            {isAuthenticated ? t('common.go_to_dashboard') : t('common.get_started')} <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                        </Button>
                        <a href="#how-it-works" className="flex items-center gap-2 text-slate-600 font-semibold hover:text-indigo-600 transition-colors px-6 h-14">
                            See how it works <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div className="mt-20 relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <div className="bg-slate-900 rounded-3xl p-2 shadow-2xl mx-auto max-w-4xl overflow-hidden border border-slate-800">
                            <div className="bg-slate-800 rounded-2xl p-4 aspect-[16/9] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                                <div className="z-10 text-center">
                                    <BarChart3 className="w-16 h-16 text-indigo-400 mx-auto mb-4 opacity-50" />
                                    <p className="text-slate-400 font-medium">Dashboard Preview</p>
                                </div>
                                {/* Mock UI Elements */}
                                <div className="absolute top-10 left-10 w-48 h-32 bg-slate-700/50 rounded-xl backdrop-blur-sm border border-slate-600 p-4">
                                    <div className="h-2 w-20 bg-slate-600 rounded mb-4"></div>
                                    <div className="h-4 w-full bg-indigo-500/50 rounded mb-2"></div>
                                    <div className="h-4 w-2/3 bg-slate-600 rounded"></div>
                                </div>
                                <div className="absolute bottom-10 right-10 w-48 h-32 bg-slate-700/50 rounded-xl backdrop-blur-sm border border-slate-600 p-4">
                                    <div className="h-2 w-20 bg-slate-600 rounded mb-4"></div>
                                    <div className="flex gap-2">
                                        <div className="h-12 w-12 rounded-full bg-slate-600"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-full bg-slate-600 rounded"></div>
                                            <div className="h-3 w-1/2 bg-slate-600 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-slate-50 border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Everything you need to scale</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">One platform to handle your entire PG business. Simple, fast, and secure.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="group p-8 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300">
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-24 bg-slate-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-8">Get started in minutes, <br />not days.</h2>
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Create your PG profile", text: "Add your property details, room configurations, and bed counts." },
                                    { step: "02", title: "Onboard tenants", text: "Fast digital onboarding with rent details and digital documentation." },
                                    { step: "03", title: "Auto-track collections", text: "Monthly rent records are auto-generated. Just mark as paid." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 font-bold shadow-sm border border-slate-100 italic">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                                            <p className="text-slate-600">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-2xl transform rotate-3 relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-md"></div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-32 bg-white/40 rounded"></div>
                                        <div className="h-2 w-20 bg-white/20 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-semibold opacity-70">PENDING RENT</span>
                                            <span className="text-xs bg-red-400 px-2 py-0.5 rounded text-white font-bold">4 DUE</span>
                                        </div>
                                        <div className="text-2xl font-bold">₹45,500</div>
                                    </div>
                                    <div className="p-4 bg-white/10 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-semibold opacity-70">VACANCY</span>
                                            <span className="text-xs bg-green-400 px-2 py-0.5 rounded text-white font-bold">12 BEDS</span>
                                        </div>
                                        <div className="text-2xl font-bold">18% Available</div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Proposition Section */}
            <section id="value" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">Zero paperwork. <br />Maximum control.</h2>
                                <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                                    Stop chasing tenants and digging through notebooks. PGKhata gives you a professional system to manage your single greatest asset efficiently.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    {[
                                        "Real-time payment visibility",
                                        "Secure digital storage for documents",
                                        "Instant financial summaries",
                                        "Collaborative access for caretakers"
                                    ].map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-3 text-indigo-100 font-medium">
                                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={handleGetStarted}
                                    className="bg-white text-indigo-900 hover:bg-slate-100 rounded-2xl px-10 h-14 text-lg font-bold"
                                    aria-label={isAuthenticated ? 'Back to Workspace' : 'Join the Community'}
                                >
                                    {isAuthenticated ? 'Back to Workspace' : 'Join the Community'}
                                </Button>
                            </div>
                            <div className="flex justify-center">
                                <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(99,102,241,0.3)]">
                                    <ShieldCheck className="w-32 h-32 text-white opacity-90" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="text-white w-5 h-5" />
                                </div>
                                <span className="text-xl font-bold text-slate-900">PGKhata</span>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Modernizing PG management across India. Built for owners who value their time.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                            <div>
                                <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Product</h5>
                                <ul className="space-y-4">
                                    <li><a href="#features" className="text-sm text-slate-600 hover:text-indigo-600">Features</a></li>
                                    <li><a href="#value" className="text-sm text-slate-600 hover:text-indigo-600">Security</a></li>
                                    <li><button onClick={handleGetStarted} className="text-sm text-slate-600 hover:text-indigo-600 cursor-pointer">Pricing</button></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Company</h5>
                                <ul className="space-y-4">
                                    <li><a href="#how-it-works" className="text-sm text-slate-600 hover:text-indigo-600">About Us</a></li>
                                    <li><button onClick={handleGetStarted} className="text-sm text-slate-600 hover:text-indigo-600 cursor-pointer">Careers</button></li>
                                    <li><button onClick={handleGetStarted} className="text-sm text-slate-600 hover:text-indigo-600 cursor-pointer">Contact</button></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Support</h5>
                                <ul className="space-y-4">
                                    <li><button onClick={handleGetStarted} className="text-sm text-slate-600 hover:text-indigo-600 cursor-pointer">Help Center</button></li>
                                    <li><button onClick={handleGetStarted} className="text-sm text-slate-600 hover:text-indigo-600 cursor-pointer">Privacy Policy</button></li>
                                    <li><button onClick={handleGetStarted} className="text-sm text-slate-600 hover:text-indigo-600 cursor-pointer">Terms of Use</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-200 text-center">
                        <p className="text-slate-400 text-sm">&copy; 2026 PGKhata. Made for Indian PG Owners.</p>
                    </div>
                </div>
            </footer>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in border border-slate-100 overflow-y-auto max-h-[90vh]">
                        <div className="p-6 sm:p-12">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                                    <MessageCircle className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Almost there!</h2>
                                <p className="text-slate-500 font-medium">Leave your details and we'll reach out to onboard you instantly via WhatsApp.</p>
                            </div>

                            <form onSubmit={handleWhatsAppSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        placeholder="John Doe"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <PhoneInput
                                        label="Phone Number"
                                        placeholder="98765 43210"
                                        required
                                        value={formData.phone}
                                        onChange={val => setFormData({ ...formData, phone: val })}
                                    />
                                </div>
                                <Input
                                    label="PG Name"
                                    placeholder="Bright House PG"
                                    required
                                    value={formData.pgName}
                                    onChange={e => setFormData({ ...formData, pgName: e.target.value })}
                                />
                                <Input
                                    label="City"
                                    placeholder="Pune"
                                    required
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />

                                <Button type="submit" className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-indigo-100 mt-4 bg-indigo-600 hover:bg-indigo-700">
                                    Send via WhatsApp <MessageCircle className="ml-2 w-5 h-5 fill-white/20" />
                                </Button>
                                <p className="text-center text-xs text-slate-400">
                                    By clicking, you'll be redirected to WhatsApp to chat with our onboarding team.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
