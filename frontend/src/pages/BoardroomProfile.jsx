// Public profile page for Companies (displaying mission and signal history).
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Shield, Globe, ArrowLeft, TrendingUp, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { API_URL } from '../config';

const BoardroomProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/api/companies/${id}/profile`);
                if (!res.ok) throw new Error("Boardroom dossier not accessible.");
                const data = await res.json();
                setCompany(data);
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
                <p className="tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-black text-red-500 font-mono flex items-center justify-center">
            <div className="text-center">
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold tracking-widest mb-2">ACCESS DENIED</h2>
                <p className="text-sm opacity-70 mb-6">{error}</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 border border-red-500/30 hover:bg-red-900/10 rounded transition-colors text-xs tracking-widest uppercase">
                    Return to Grid
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative selection:bg-green-900 selection:text-white pb-20">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-8">
                {/* Header / Nav */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-green-500/50 hover:text-green-400 transition-colors text-xs tracking-widest uppercase"
                >
                    <ArrowLeft size={14} /> Back
                </button>

                {/* Company Header Card */}
                <div className="bg-black/80 border border-green-500/20 rounded-2xl p-8 mb-8 flex items-center gap-8 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Building2 size={300} />
                    </div>

                    <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        {company.logo_url ? (
                            <img src={company.logo_url} alt="logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <Building2 size={48} className="text-black" />
                        )}
                    </div>

                    <div className="flex-1 z-10">
                        <h1 className="text-5xl font-black text-white tracking-tight uppercase mb-2">{company.name}</h1>
                        <div className="flex items-center gap-6 text-sm text-green-500/60 uppercase tracking-widest mb-6">
                            {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                                    <Globe size={14} /> Corporate Net
                                </a>
                            )}
                            <span className="flex items-center gap-2">
                                <Shield size={14} /> Verified Boardroom
                            </span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex gap-4">
                            <StatBadge label="Acceptance Rate" value={`${company.stats.acceptance_rate}%`} color="text-yellow-500" />
                            <StatBadge label="Total Signals" value={company.stats.total_received} />
                            <StatBadge label="Acquisitions" value={company.stats.accepted} color="text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left: Active Bounties (In Review) */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2 border-b border-green-500/20 pb-4">
                            <Clock size={20} className="text-blue-500" />
                            Active Evaluations
                        </h2>

                        {company.in_review.length === 0 ? (
                            <div className="p-8 border border-dashed border-green-500/20 rounded-xl text-center text-green-500/30 text-xs uppercase tracking-widest">
                                No signals currently in review
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {company.in_review.map(idea => (
                                    <div key={idea.id} className="bg-green-900/5 border border-green-500/10 p-5 rounded-xl hover:bg-green-900/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-green-300 text-sm truncate pr-4">{idea.title}</h3>
                                            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider">In Review</span>
                                        </div>
                                        <div className="flex justify-between items-end text-[10px] text-green-500/40 uppercase tracking-wider">
                                            <span>From: {idea.sender_name}</span>
                                            <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Portfolio Acquisitions (Accepted) */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center gap-2 border-b border-green-500/20 pb-4">
                            <TrendingUp size={20} className="text-green-500" />
                            Secure Acquisitions
                        </h2>

                        {company.acquisitions.length === 0 ? (
                            <div className="p-8 border border-dashed border-green-500/20 rounded-xl text-center text-green-500/30 text-xs uppercase tracking-widest">
                                No acquisitions on public record
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {company.acquisitions.map(idea => (
                                    <div key={idea.id} className="bg-black border border-green-500/20 p-5 rounded-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <CheckCircle2 size={64} className="text-green-500" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-white text-lg">{idea.title}</h3>
                                                <div className="text-right">
                                                    <div className="text-green-400 font-bold text-sm">{idea.value || 'N/A'}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {idea.tags && idea.tags.split(',').map((tag, i) => (
                                                    <span key={i} className="text-[9px] px-2 py-0.5 bg-white/5 rounded text-green-500/60 uppercase tracking-wider">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-green-500/40 uppercase tracking-widest">
                                                <span>Acquired From: {idea.acquired_from}</span>
                                                <span>{new Date(idea.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

const StatBadge = ({ label, value, color = "text-white" }) => (
    <div className="bg-black/50 border border-green-500/20 px-4 py-2 rounded-lg backdrop-blur-md">
        <div className={`text-xl font-black ${color}`}>{value}</div>
        <div className="text-[9px] text-green-500/50 uppercase tracking-widest">{label}</div>
    </div>
);

export default BoardroomProfile;
