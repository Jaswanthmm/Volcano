// Public profile page for Aliens (displaying stats and signals).
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Shield, Star, Activity, ArrowLeft, Briefcase, Zap, Calendar, Database, Clock } from 'lucide-react';
import { API_URL } from '../config';

const AlienProfile = () => {
    const { id } = useParams(); // Can be ID or Username
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/api/users/alien/${id}`);
                if (!res.ok) throw new Error("Alien identity not found in database.");
                const data = await res.json();
                setProfile(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full"></div>
                <p className="tracking-widest animate-pulse">DECRYPTING IDENTITY...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-black text-red-500 font-mono flex items-center justify-center">
            <div className="text-center">
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold tracking-widest mb-2">ACCESS DENIED</h2>
                <p className="text-sm opacity-70 mb-6">{error}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => navigate(-1)} className="px-6 py-2 border border-red-500/30 hover:bg-red-900/10 rounded transition-colors text-xs tracking-widest uppercase">
                        Return to Grid
                    </button>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="px-6 py-2 bg-red-900/20 border border-red-500/50 hover:bg-red-900/40 text-red-400 rounded transition-colors text-xs tracking-widest uppercase">
                        Logout & Reset
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative selection:bg-green-900 selection:text-white pb-20">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-900/10 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto p-8">
                {/* Header / Nav */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-green-500/50 hover:text-green-400 transition-colors text-xs tracking-widest uppercase"
                >
                    <ArrowLeft size={14} /> Back
                </button>

                {/* Identity Card */}
                <div className="bg-green-900/5 border border-green-500/20 rounded-2xl p-8 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <User size={200} />
                    </div>

                    <div className="flex items-start gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-xl bg-black border border-green-500/30 flex items-center justify-center text-4xl font-bold text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                            {profile.username[0].toUpperCase()}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-white tracking-wider uppercase">{profile.username}</h1>
                                {profile.stats.reputation > 80 && (
                                    <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-bold tracking-widest rounded uppercase flex items-center gap-1">
                                        <Star size={10} fill="currentColor" /> Elite
                                    </span>
                                )}
                            </div>
                            <p className="text-green-500/50 text-xs tracking-widest uppercase mb-6 flex items-center gap-4">
                                <span>ID: {profile.id.toString().padStart(6, '0')}</span>
                                <span className="flex items-center gap-1"><Calendar size={10} /> Joined {profile.joined_at}</span>
                            </p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-4">
                                <StatBox label="Reputation" value={`${profile.stats.reputation}% `} icon={<Star size={14} />} />
                                <StatBox label="Signals Sent" value={profile.stats.total_signals} icon={<Activity size={14} />} />
                                <StatBox label="Accepted" value={profile.stats.accepted} icon={<Briefcase size={14} />} highlight />
                                <StatBox label="Filtered" value={profile.stats.filtered} icon={<Shield size={14} />} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-3 gap-8">

                    {/* Left: Portfolio (Accepted Ideas) */}
                    <div className="col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2 border-b border-green-500/20 pb-4">
                            <Briefcase size={20} className="text-green-500" />
                            Portfolio Assets
                        </h2>

                        {profile.portfolio.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-green-500/20 rounded-xl bg-green-900/5">
                                <p className="text-green-500/40 text-sm tracking-widest uppercase">No assets secured yet</p>
                            </div>
                        ) : (
                            profile.portfolio.map(idea => (
                                <div key={idea.id} className="bg-black/50 border border-green-500/10 rounded-xl p-6 hover:border-green-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                {idea.company_logo_url ? (
                                                    <img src={idea.company_logo_url} className="w-5 h-5 rounded-full object-contain bg-white" alt="logo" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[8px] text-white font-bold">{idea.company_name[0]}</div>
                                                )}
                                                <span className="text-[10px] text-green-500/60 uppercase tracking-widest">{idea.company_name}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-green-300 group-hover:text-green-400 transition-colors uppercase">{idea.title}</h3>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">{idea.potential_value || 'Undisclosed'}</div>
                                            <div className="text-[9px] text-green-500/40 uppercase tracking-wider">Value</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-green-500/60 leading-relaxed mb-4 line-clamp-2">
                                        {idea.content}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {idea.tags && idea.tags.split(',').map((tag, i) => (
                                            <span key={i} className="text-[9px] px-2 py-1 rounded bg-green-500/5 border border-green-500/10 text-green-400 uppercase tracking-wider">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right: Recent Activity Stream */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2 border-b border-green-500/20 pb-4">
                            <Zap size={20} className="text-yellow-500" />
                            Signal Stream
                        </h2>

                        <div className="space-y-4 relative">
                            {/* Connector Line */}
                            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-green-500/10"></div>

                            {profile.recent_activity.map((activity, i) => (
                                <div key={i} className="relative pl-8">
                                    <div className={`absolute left - 0 top - 1.5 w - 5 h - 5 rounded - full border - 2 flex items - center justify - center bg - black z - 10
                                        ${activity.status === 'accepted' ? 'border-green-500 text-green-500' :
                                            activity.status === 'rejected' ? 'border-red-500/50 text-red-500/50' :
                                                activity.status === 'volcano_rejected' ? 'border-orange-500/50 text-orange-500/50' :
                                                    'border-blue-500/50 text-blue-500/50'
                                        } `}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                    </div>

                                    <div className="bg-green-900/5 border border-green-500/10 rounded-lg p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text - [9px] font - bold uppercase tracking - wider px - 1.5 py - 0.5 rounded
                                                ${activity.status === 'accepted' ? 'bg-green-500/10 text-green-400' :
                                                    activity.status === 'processing' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-white/5 text-white/40'
                                                } `}>
                                                {activity.status.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[9px] text-green-500/30">{new Date(activity.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-green-300 font-bold truncate mb-1">{activity.title}</p>
                                        <p className="text-[10px] text-green-500/40 uppercase tracking-wide">Target: {activity.company_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatBox = ({ label, value, icon, highlight }) => (
    <div className={`p - 4 rounded - xl border flex flex - col items - center justify - center text - center gap - 2 transition - all
        ${highlight ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-black border-green-500/20 text-green-600'} `}>
        <div className="opacity-50">{icon}</div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-[9px] uppercase tracking-widest opacity-60">{label}</div>
    </div>
);

export default AlienProfile;
