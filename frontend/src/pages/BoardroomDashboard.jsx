import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Activity, Shield, Users, Loader2, CheckCircle2, XCircle, Search, Clock, ChevronRight, User, Star, Zap } from 'lucide-react';

const BoardroomDashboard = () => {
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // View State
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'scout'
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Data State
    const [signals, setSignals] = useState([]);
    const [selectedSignal, setSelectedSignal] = useState(null);
    const [aliens, setAliens] = useState([]);
    const [selectedAlienProfile, setSelectedAlienProfile] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('titan_user');
        if (!storedUser) {
            navigate('/login/boardroom');
            return;
        }
        const companyData = JSON.parse(storedUser);
        setCompany(companyData);

        // Fetch Data Parallel
        Promise.all([
            fetch(`http://127.0.0.1:5000/api/ideas/company/${companyData.id}`),
            fetch(`http://127.0.0.1:5000/api/users/aliens`)
        ])
            .then(async ([signalsRes, aliensRes]) => {
                if (signalsRes.ok) {
                    const signalData = await signalsRes.json();
                    setSignals(signalData);
                    if (signalData.length > 0) setSelectedSignal(signalData[0]);
                }
                if (aliensRes.ok) {
                    setAliens(await aliensRes.json());
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

    }, [navigate]);

    const handleStatusUpdate = async (status) => {
        if (!selectedSignal) return;

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/ideas/${selectedSignal.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                const updatedSignals = signals.map(s =>
                    s.id === selectedSignal.id ? { ...s, status } : s
                );
                setSignals(updatedSignals);
                setSelectedSignal({ ...selectedSignal, status });
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const openAlienProfile = async (username) => {
        try {
            // Check if username is valid, if not (e.g. from Unknown in weird case), return
            if (!username) return;

            const res = await fetch(`http://127.0.0.1:5000/api/users/alien/${username}`);
            if (res.ok) {
                const profile = await res.json();
                setSelectedAlienProfile(profile);
                setShowProfileModal(true);
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('titan_token');
        localStorage.removeItem('titan_user');
        navigate('/');
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050b14] text-white flex items-center justify-center font-sans">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                <p className="text-xs uppercase tracking-[0.3em] text-blue-400/50">Loading Intelligence...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050b14] text-white font-sans selection:bg-blue-500 selection:text-white overflow-hidden flex flex-col relative">

            {/* Top Navigation Bar */}
            <div className="h-16 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
                        <Box size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm tracking-wide">{company?.company_name}</h1>
                        <p className="text-[10px] text-blue-400 uppercase tracking-widest">Boardroom Access</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'feed' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Feed
                        </button>
                        <button
                            onClick={() => setActiveTab('archive')}
                            className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'archive' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Archive
                        </button>
                        <button
                            onClick={() => setActiveTab('scout')}
                            className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'scout' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Talent Scout
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/20 border border-blue-500/20 rounded-full">
                        <Activity size={12} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-200">SYSTEM NORMAL</span>
                    </div>
                    <button onClick={handleLogout} className="text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors">
                        Disconnect
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">

                {/* --- FEED & ARCHIVE VIEW --- */}
                {(activeTab === 'feed' || activeTab === 'archive') && (
                    <>
                        {/* Sidebar */}
                        <div className="w-96 border-r border-white/5 bg-[#0a101f] flex flex-col">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={14} /> {activeTab === 'feed' ? 'Intelligence Feed' : 'Signal Archive'}
                                </h2>
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {signals.filter(s => activeTab === 'feed' ? s.status === 'pending' : s.status !== 'pending').length}
                                </span>
                            </div>

                            <div className="p-3">
                                <div className="bg-black/20 border border-white/5 rounded-lg flex items-center px-3 py-2">
                                    <Search size={14} className="text-white/20" />
                                    <input type="text" placeholder="Filter signals..." className="bg-transparent border-none outline-none text-xs text-white ml-2 placeholder-white/20 w-full" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {signals
                                    .filter(s => activeTab === 'feed' ? s.status === 'pending' : s.status !== 'pending')
                                    .map(signal => (
                                        <div
                                            key={signal.id}
                                            onClick={() => setSelectedSignal(signal)}
                                            className={`p-4 border-b border-white/5 cursor-pointer transition-colors group ${selectedSignal?.id === signal.id ? 'bg-blue-900/10 border-l-2 border-l-blue-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`text-sm font-bold truncate ${selectedSignal?.id === signal.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{signal.title}</h3>
                                                {signal.status === 'pending' && <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>}
                                                {signal.status === 'accepted' && <CheckCircle2 size={12} className="text-blue-500" />}
                                                {signal.status === 'rejected' && <XCircle size={12} className="text-red-500/50" />}
                                            </div>
                                            <p className="text-[11px] text-white/40 mb-2 truncate">{signal.content}</p>
                                            <div className="flex items-center justify-between text-[10px] text-white/20 uppercase tracking-wider">
                                                <span>From: {signal.sender_identifier}</span>
                                                <span>{new Date(signal.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Detail View */}
                        <div className="flex-1 bg-[#050b14] flex flex-col relative">
                            {selectedSignal ? (
                                <>
                                    <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-white/[0.02]">
                                        <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
                                            <Clock size={12} />
                                            Received: {new Date(selectedSignal.created_at).toLocaleString()}
                                        </div>
                                        <div className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${selectedSignal.status === 'pending' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' :
                                            selectedSignal.status === 'accepted' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                                'border-red-500/30 text-red-500 bg-red-500/10'
                                            }`}>
                                            Status: {selectedSignal.status}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-12 max-w-4xl mx-auto w-full">
                                        <div className="mb-8">
                                            <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{selectedSignal.title}</h1>
                                            <button
                                                onClick={() => openAlienProfile(selectedSignal.sender_identifier)}
                                                className="flex items-center gap-3 group hover:bg-white/5 p-2 pr-4 rounded-lg transition-colors -ml-2"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold ring-2 ring-transparent group-hover:ring-blue-500 transition-all">
                                                    {selectedSignal.sender_identifier[0].toUpperCase()}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Source: {selectedSignal.sender_identifier}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-white/60">View Operative Dossier</p>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="prose prose-invert max-w-none">
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-white/80 leading-relaxed whitespace-pre-wrap shadow-2xl">
                                                {selectedSignal.content}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 bg-[#0a101f] p-6 flex items-center justify-end gap-4">
                                        {selectedSignal.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate('rejected')}
                                                    className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                                >
                                                    <XCircle size={16} /> Discard Signal
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate('accepted')}
                                                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02]"
                                                >
                                                    <CheckCircle2 size={16} /> Acquire Asset
                                                </button>
                                            </>
                                        )}
                                        {selectedSignal.status !== 'pending' && (
                                            <p className="text-xs text-white/30 italic">Processing Complete.</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                                    <Activity size={48} className="mb-4 opacity-50" />
                                    <p className="text-sm uppercase tracking-widest">Select a signal to analyze</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* --- SCOUT VIEW --- */}
                {activeTab === 'scout' && (
                    <div className="flex-1 bg-[#050b14] overflow-y-auto p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-10 text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">Talent Scout</h2>
                                <p className="text-blue-400/50 text-xs uppercase tracking-widest">Global Operative Database</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {aliens.map(alien => (
                                    <div
                                        key={alien.id}
                                        onClick={() => openAlienProfile(alien.username)}
                                        className="bg-[#0a101f] border border-white/5 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-blue-900/5 cursor-pointer transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <User size={64} />
                                        </div>

                                        <div className="flex items-center gap-4 mb-6 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-blue-900/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                                                {alien.username[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white leading-tight">{alien.username}</h3>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest">Operative</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-[9px] text-blue-400 mb-1 uppercase tracking-wider">Reputation</p>
                                                <div className="flex items-center gap-1 text-white font-bold">
                                                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                    {alien.reputation}%
                                                </div>
                                            </div>
                                            <div className="bg-black/20 rounded-lg p-3">
                                                <p className="text-[9px] text-blue-400 mb-1 uppercase tracking-wider">Transmissions</p>
                                                <div className="flex items-center gap-1 text-white font-bold">
                                                    <Zap size={12} className="text-purple-500" />
                                                    {alien.total_signals}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full bg-blue-600/10 text-blue-400 py-2 rounded text-[10px] font-bold uppercase tracking-widest text-center group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10">
                                            View Dossier
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* --- PROFILE MODAL --- */}
            {showProfileModal && selectedAlienProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a101f] border border-blue-500/30 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-transparent relative">
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                            >
                                <XCircle size={24} />
                            </button>

                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                    {selectedAlienProfile.username[0]}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedAlienProfile.username}</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Verified Human</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto">

                            {/* Company Badges Section */}
                            <div className="mb-8">
                                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Shield size={12} /> Corporate Assets
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {selectedAlienProfile.portfolio.length > 0 ? (
                                        Object.values(selectedAlienProfile.portfolio.reduce((acc, item) => {
                                            if (!acc[item.company_name]) acc[item.company_name] = { name: item.company_name, count: 0 };
                                            acc[item.company_name].count += 1;
                                            return acc;
                                        }, {})).map((badge, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-blue-900/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-300 border border-blue-500/30">
                                                    {badge.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-blue-500/70 uppercase tracking-wider leading-none">ASSET</span>
                                                    <span className="text-xs font-bold text-blue-300 leading-none">{badge.count}</span>
                                                </div>
                                                <span className="text-[10px] text-white/50 uppercase tracking-wider ml-1">{badge.name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-white/20 text-xs italic">No assets acquired.</span>
                                    )}
                                </div>
                            </div>


                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">End of Operative Record</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BoardroomDashboard;
