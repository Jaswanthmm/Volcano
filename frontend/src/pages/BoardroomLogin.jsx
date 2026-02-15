// Authentication page for Boardroom Titans (Register/Login).
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Lock, ArrowRight, Shield, Building, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../config';

const BoardroomLogin = () => {
    const [isLogin, setIsLogin] = useState(true);
    // ... (lines 8-38 unchanged) 
    const [formData, setFormData] = useState({ company_name: '', email: '', password: '', website_url: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!isLogin) {
            const domain = formData.email.split('@')[1];
            const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
            if (blockedDomains.includes(domain)) {
                setError("Corporate domain required. Public email providers are not authorized.");
                setLoading(false);
                return;
            }
            if (!formData.website_url.includes('.')) { // Basic validation
                setError("Please enter a valid company website URL.");
                setLoading(false);
                return;
            }
        }

        const endpoint = isLogin ? '/api/auth/boardroom/login' : '/api/auth/boardroom/register';

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Server returned invalid response.');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Connection refused by mainframe.');
            }

            if (isLogin) {
                localStorage.setItem('titan_token', 'mock_token');
                localStorage.setItem('titan_user', JSON.stringify(data));
                navigate('/boardroom/dashboard');
            } else {
                setIsLogin(true);
                setFormData({ company_name: '', email: '', password: '', website_url: '' });
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-space relative overflow-hidden flex items-center justify-center selection:bg-blue-500 selection:text-white">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-900/10 blur-[100px] rounded-full opacity-40"></div>

                {/* Subtle Grid */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
                        backgroundSize: '80px 80px',
                        maskImage: 'linear-gradient(to bottom, black, transparent 90%)'
                    }}>
                </div>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-md p-6">

                {/* Header content */}
                <div className="mb-12 text-center">
                    <Link to="/" className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-white/5 border border-white/10 rounded-2xl text-blue-400 shadow-2xl backdrop-blur-xl hover:scale-105 transition-transform duration-300">
                        <Building2 size={32} />
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white">Boardroom Access</h1>
                    <p className="text-blue-200/50 text-xs uppercase tracking-[0.3em] font-bold">Industrial Intelligence Portal</p>
                </div>

                {/* Login Form */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-[0_0_60px_rgba(30,58,138,0.2)]">

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/20 border border-red-500/20 rounded-xl text-red-200 text-xs flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-blue-200/50 font-bold ml-1">Company Name</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/20 text-sm"
                                            placeholder="Volcano Industries"
                                            autoComplete="off"
                                        />
                                        <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                            <Building size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-blue-200/50 font-bold ml-1">Company Website</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="website_url"
                                            value={formData.website_url}
                                            onChange={handleChange}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/20 text-sm"
                                            placeholder="https://example.com"
                                            autoComplete="off"
                                        />
                                        <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                            <div className="text-[10px] font-bold text-blue-500">WWW</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-blue-200/50 font-bold ml-1">Corporate Email</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/20 text-sm"
                                    placeholder="executive@corp.com"
                                    autoComplete="off"
                                />
                                <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                    <Shield size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/50 font-bold">Secure Credentials</label>
                                {isLogin && <a href="#" className="text-[10px] text-blue-400/60 hover:text-blue-400 transition-colors">Forgot Key?</a>}
                            </div>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/20 text-sm"
                                    placeholder="••••••••••••"
                                    autoComplete="new-password"
                                />
                                <div
                                    className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors cursor-pointer hover:text-white"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions (Registration Only) */}
                        {!isLogin && (
                            <div className="flex items-center gap-2 mt-4 ml-1">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    required
                                    className="w-3 h-3 bg-black/20 border border-blue-200/30 rounded focus:ring-1 focus:ring-blue-500 text-blue-500 cursor-pointer"
                                />
                                <label htmlFor="terms" className="text-[9px] text-blue-200/60 uppercase tracking-wide cursor-pointer select-none">
                                    I accept the <Link to="/terms" target="_blank" className="text-blue-400 hover:text-white transition-colors">Protocol Terms & Conditions</Link>
                                </label>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full group bg-white text-black hover:bg-blue-50 border border-transparent rounded-xl px-4 py-4 mt-8 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-blue-900/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Processing...' : (isLogin ? 'Enter Boardroom' : 'Request Access')}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* Toggle View */}
                    <div className="mt-8 text-center pt-6 border-t border-white/5">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-[11px] text-blue-200/40 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            {isLogin ? (
                                <>New Organization? <span className="text-blue-400">Apply for Partnership</span></>
                            ) : (
                                <>Already a Partner? <span className="text-blue-400">Access Dashboard</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-2">Protected by</div>
                    <div className="flex items-center justify-center gap-2 opacity-30">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-bold tracking-widest text-[10px]">VOLCANO SECURITY</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BoardroomLogin;