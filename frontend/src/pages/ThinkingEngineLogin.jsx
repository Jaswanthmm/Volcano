// Restricted login for the Thinking Engine visualization (Admins only).
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Lock, Key, AlertTriangle } from 'lucide-react';

const ThinkingEngineLogin = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simple Admin Authentication Simulation
        // In production, this verifies against backend. Here, we simulate a strict key.
        setTimeout(() => {
            if (password === 'volcano_admin' || password === 'admin') {
                localStorage.setItem('thinking_engine_token', 'valid_session');
                navigate('/thinking-engine');
            } else {
                setError('ACCESS DENIED. INVALID CRYPTO KEY.');
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#050510] font-mono flex items-center justify-center relative overflow-hidden text-purple-500">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="text-center mb-10 animate-fade-in-down">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.5)] mb-6">
                        <BrainCircuit size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-[0.3em] text-white">Thinking Engine</h1>
                    <p className="text-xs text-purple-500/60 mt-2 tracking-widest uppercase">Restricted Neural Interface</p>
                </div>

                <form onSubmit={handleLogin} className="bg-black/40 border border-purple-900/30 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                    {/* Scanline */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-10 pointer-events-none"></div>

                    <div className="mb-6">
                        <label className="block text-[10px] uppercase tracking-widest text-purple-500/60 mb-2 pl-1">Access Code</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/40" size={16} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-purple-900/30 rounded-lg py-3 pl-12 pr-4 text-purple-200 placeholder-purple-900/50 focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all font-bold tracking-widest text-center"
                                placeholder="••••••••"
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 text-red-500 text-xs font-bold bg-red-900/10 p-3 rounded border border-red-500/20 animate-pulse">
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-[0.2em] uppercase rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                    >
                        {loading ? (
                            <span className="animate-pulse">Verifying Identity...</span>
                        ) : (
                            <>
                                <Key size={16} /> Authenticate
                            </>
                        )}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-purple-900 uppercase tracking-widest">Authorized Personnel Only</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ThinkingEngineLogin;
