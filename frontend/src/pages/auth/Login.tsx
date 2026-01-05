import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { Building2, ArrowRight } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/login/access-token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            await login(response.data.access_token);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 skew-y-[-6deg] origin-top-left translate-y-[-20%] z-0"></div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 p-8 z-10 animate-fade-in relative">

                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 transform rotate-3 hover:rotate-6 transition-transform">
                        <Building2 className="text-white h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">PGKhata</h1>
                    <p className="text-slate-500 mt-2 font-medium">Welcome back, Owner!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-slate-50 border-transparent focus:bg-white"
                    />

                    <div className="space-y-1">
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-slate-50 border-transparent focus:bg-white"
                        />
                        <div className="text-right">
                            <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Forgot password?</a>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-center animate-pulse">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <Button type="submit" isLoading={isLoading} className="w-full h-12 text-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">
                        Sign In <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-400">
                    <p>Protected by PGKhata Secure Login</p>
                    <p>&copy; 2026 PGKhata Inc</p>
                </div>
            </div>
        </div>
    );
};
