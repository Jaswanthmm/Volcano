// Authentication page for Aliens (Register/Login).
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';

const AlienLogin = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', identifier: '', name: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
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
        setSuccessMsg('');

        const endpoint = isLogin ? '/api/auth/alien/login' : '/api/auth/alien/register';
        const payload = isLogin
            ? { identifier: formData.identifier, password: formData.password }
            : { email: formData.email, password: formData.password, name: formData.name };

        try {
            const response = await fetch(`${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse response:", text);
                throw new Error(`Server returned invalid response: ${text.substring(0, 50)}...`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Transmission failed.');
            }

            if (isLogin) {
                localStorage.setItem('alien_token', 'mock_token');
                localStorage.setItem('alien_user', JSON.stringify(data));
                navigate('/alien/dashboard');
                alert(`Welcome back, Node ${data.alien_id}`);
            } else {
                setSuccessMsg(`Uplink Established! Your Node Identifier is: ${data.alien_id}`);
                setIsLogin(true);
                setSuccessMsg(`Uplink Established! Your Node Identifier is: ${data.alien_id}`);
                setIsLogin(true);
                setSuccessMsg(`Uplink Established! Your Node Identifier is: ${data.alien_id}`);
                setIsLogin(true);
                setFormData({ email: '', password: '', identifier: data.alien_id, name: '' });
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden selection:bg-green-900 selection:text-white flex items-center justify-center">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.4)]"></div>
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)',
                        backgroundSize: '50px 50px'
                    }}>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-900/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-md p-2">

                {/* Header content */}
                <div className="mb-12 text-center relative group">
                    <div className="inline-block relative">
                        <div className="absolute -inset-1 rounded-lg bg-green-500/20 blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                        <Link to="/" className="relative flex items-center justify-center w-16 h-16 mx-auto mb-6 border border-green-500/30 bg-black rounded-xl text-green-400 group-hover:text-green-300 group-hover:border-green-400/50 transition-all">
                            <User size={32} />
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2 text-white">Alien Node</h1>
                    <p className="text-green-500/60 text-xs tracking-widest">SECURE UPLINK v3.1</p>
                </div>

                {/* Login Form */}
                <div className="bg-black/50 backdrop-blur-md border border-green-500/20 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">

                    {/* Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://media.giphy.com/media/dummy/giphy.gif')] mix-blend-overlay"></div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-xs flex items-center gap-2">
                            <Shield size={14} /> {successMsg}
                        </div>
                    )}

                    <form className="relative z-10 space-y-6" onSubmit={handleSubmit} autoComplete="off">
                        {!isLogin && (<>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/50 font-bold block">Signal Frequency (Email)</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-900/50 text-sm"
                                        placeholder="entity@void.net"
                                        autoComplete="new-password"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/20 group-focus-within:text-green-500/50 transition-colors">
                                        <Shield size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/50 font-bold block">Alien Name</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-900/50 text-sm"
                                        placeholder="Zorgon the Conqueror"
                                        autoComplete="name"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/20 group-focus-within:text-green-500/50 transition-colors">
                                        <User size={18} />
                                    </div>
                                </div>
                            </div>
                        </>)}

                        {isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/50 font-bold block">Node Identifier (Alien ID)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="identifier"
                                        value={formData.identifier}
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-900/50 text-sm"
                                        placeholder="ALIEN-XXXX or Email"
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/20 group-focus-within:text-green-500/50 transition-colors">
                                        <User size={18} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-green-500/50 font-bold block">Access Key (Password)</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-900/50 text-sm"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                <div
                                    className="absolute right-3 top-3 text-green-500/20 group-focus-within:text-green-500/50 transition-colors cursor-pointer hover:text-green-400"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full group bg-green-900/20 hover:bg-green-500 text-green-400 hover:text-black border border-green-500/30 rounded-lg px-4 py-4 mt-8 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Processing...' : (isLogin ? 'Establish Link' : 'Register Node')}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* Toggle View */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setSuccessMsg('');
                            }}
                            className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 transition-colors"
                        >
                            {isLogin ? "New Alien in the town? Initialize Protocol" : "Existing Alien? Reconnect"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-[10px] text-green-900/60 uppercase tracking-widest">
                    Encrypted via Neural Exchange v3.1
                </div>

            </div >
        </div >
    );
};

export default AlienLogin;
