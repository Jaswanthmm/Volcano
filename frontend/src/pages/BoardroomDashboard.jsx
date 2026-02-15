// Admin interface for Companies (Titans) to review and manage signals.
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Send, Database, Shield, LogOut, Loader2, AlertTriangle, CheckCircle2, Building, MessageSquare, XCircle, HelpCircle, Activity, Lock, Users, Briefcase, Search, Clock, Building2, User, Zap, Star } from 'lucide-react';
import { API_URL } from '../config';

const BoardroomDashboard = () => {
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // View State
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'scout'
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);

    // Data State
    const [signals, setSignals] = useState([]);
    const [selectedSignal, setSelectedSignal] = useState(null);
    const [aliens, setAliens] = useState([]);
    const [selectedAlienProfile, setSelectedAlienProfile] = useState(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    const openChat = async () => {
        if (!selectedSignal) return;
        setShowChatModal(true);
        // Fetch messages
        try {
            const res = await fetch(`${API_URL}/api/messages/${selectedSignal.id}`);
            if (res.ok) {
                setChatMessages(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedSignal) return;
        setSendingMsg(true);
        try {
            const res = await fetch(`${API_URL}/api/messages/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea_id: selectedSignal.id,
                    sender_type: 'titan',
                    content: newMessage
                })
            });
            if (res.ok) {
                const msg = await res.json();
                setChatMessages([...chatMessages, {
                    id: msg.id,
                    sender_type: 'titan',
                    content: newMessage,
                    created_at: msg.created_at
                }]);
                setNewMessage('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSendingMsg(false);
        }
    };

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
            fetch(`${API_URL}/api/ideas/company/${companyData.id}`),
            fetch(`${API_URL}/api/users/aliens`)
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
            const res = await fetch(`${API_URL}/api/ideas/${selectedSignal.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                const updatedSignals = signals.map(s =>
                    s.id === selectedSignal.id ? { ...s, status } : s
                );
                setSignals(updatedSignals);

                // Determine if signal should disappear from current view
                const shouldStayVisible =
                    (activeTab === 'feed' && status === 'pending') ||
                    (activeTab === 'active' && status === 'interesting') ||
                    (activeTab === 'archive' && (status === 'accepted' || status === 'rejected'));

                if (shouldStayVisible) {
                    setSelectedSignal({ ...selectedSignal, status });
                } else {
                    setSelectedSignal(null);
                }
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const openAlienProfile = async (username) => {
        try {
            // Check if username is valid, if not (e.g. from Unknown in weird case), return
            if (!username) return;

            const res = await fetch(`${API_URL}/api/users/alien/${username}`);
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
            <div className="w-full h-16 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between px-6 z-20">
                <Link to={`/boardroom/${company?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    {company?.logo_url ? (
                        <img src={company.logo_url} alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-blue-900/50 object-contain bg-white/5" />
                    ) : (
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
                            <Building2 size={18} />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-sm tracking-wide">{company?.company_name}</h1>
                        <p className="text-[10px] text-blue-400 uppercase tracking-widest">Boardroom</p>
                    </div>
                </Link>

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
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setActiveTab('scout')}
                            className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'scout' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            Aliens
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

                {/* --- FEED, ACTIVE & ARCHIVE VIEW --- */}
                {(activeTab === 'feed' || activeTab === 'active' || activeTab === 'archive') && (
                    <>
                        {/* Sidebar */}
                        <div className="w-96 border-r border-white/5 bg-[#0a101f] flex flex-col">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={14} />
                                    {activeTab === 'feed' ? 'Intelligence Feed' : activeTab === 'active' ? 'Active Signals' : 'Signal Archive'}
                                </h2>
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {signals.filter(s =>
                                        activeTab === 'feed' ? s.status === 'pending' :
                                            activeTab === 'active' ? s.status === 'interesting' :
                                                (s.status === 'accepted' || s.status === 'rejected')
                                    ).length}
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
                                    .filter(s =>
                                        activeTab === 'feed' ? s.status === 'pending' :
                                            activeTab === 'active' ? s.status === 'interesting' :
                                                (s.status === 'accepted' || s.status === 'rejected')
                                    )
                                    .map(signal => (
                                        <div
                                            key={signal.id}
                                            onClick={() => setSelectedSignal(signal)}
                                            className={`p-4 border-b border-white/5 cursor-pointer transition-colors group ${selectedSignal?.id === signal.id ? 'bg-blue-900/10 border-l-2 border-l-blue-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`text-sm font-bold truncate ${selectedSignal?.id === signal.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{signal.title}</h3>
                                                {signal.status === 'pending' && <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>}
                                                {signal.status === 'interesting' && <Star size={12} className="text-purple-500 fill-purple-500" />}
                                                {signal.status === 'accepted' && <CheckCircle2 size={12} className="text-blue-500" />}
                                                {signal.status === 'rejected' && <XCircle size={12} className="text-red-500/50" />}
                                            </div>
                                            <p className="text-[11px] text-white/40 mb-2 truncate">{signal.content}</p>
                                            <div className="flex items-center justify-between text-[10px] text-white/20 uppercase tracking-wider">
                                                <span>From: {signal.sender_name || signal.sender_identifier}</span>
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
                                            selectedSignal.status === 'interesting' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
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
                                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Source: {selectedSignal.sender_name || selectedSignal.sender_identifier}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-white/60">{selectedSignal.sender_identifier}</p>
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
                                        {(selectedSignal.status === 'pending' || selectedSignal.status === 'interesting') && (
                                            <>
                                                {/* Active Signals Actions */}
                                                {selectedSignal.status === 'interesting' && (
                                                    <button
                                                        onClick={openChat}
                                                        className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <MessageSquare size={16} /> Open Chat
                                                    </button>
                                                )}

                                                {/* Feed Actions */}
                                                {selectedSignal.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate('interesting')}
                                                        className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <Star size={16} /> Mark Interesting
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleStatusUpdate('rejected')}
                                                    className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                                                >
                                                    <XCircle size={16} /> Discard
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate('accepted')}
                                                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02]"
                                                >
                                                    <CheckCircle2 size={16} /> Acquire
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
                                <h2 className="text-3xl font-bold text-white mb-2">Aliens in Town</h2>
                                <p className="text-blue-400/50 text-xs uppercase tracking-widest">Highly Potential Aliens</p>
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
                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] uppercase font-bold tracking-widest">Verified Alien</span>
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
                                <div className="flex flex-wrap gap-3 items-center">
                                    {selectedAlienProfile.portfolio.length > 0 ? (
                                        (() => {
                                            // Aggregate assets
                                            const assetsMap = selectedAlienProfile.portfolio.reduce((acc, item) => {
                                                const name = item.company_name;
                                                // Use backend provided logo
                                                const logo = item.company_logo_url;
                                                if (!acc[name]) acc[name] = { name, logo, count: 0 };
                                                acc[name].count++;
                                                return acc;
                                            }, {});

                                            const sortedAssets = Object.values(assetsMap).sort((a, b) => b.count - a.count);
                                            const displayLimit = 4;
                                            const visibleAssets = sortedAssets.slice(0, displayLimit);
                                            const remaining = sortedAssets.length - displayLimit;

                                            return (
                                                <>
                                                    {visibleAssets.map((asset, idx) => (
                                                        <CompanyBadge key={idx} asset={asset} />
                                                    ))}

                                                    {remaining > 0 && (
                                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-help" title={`${remaining} more assets`}>
                                                            +{remaining}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()
                                    ) : (
                                        <span className="text-white/20 text-xs italic tracking-widest">No assets acquired.</span>
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
            )
            }

            {/* --- INQUIRY CHAT MODAL --- */}
            {
                showChatModal && selectedSignal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#0a101f] border border-blue-500/30 w-full max-w-4xl rounded-2xl shadow-2xl relative overflow-hidden flex h-[600px]">

                            {/* Modal Close */}
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-50"
                            >
                                <XCircle size={24} />
                            </button>

                            {/* Left: Context Summary */}
                            <div className="w-1/3 bg-black/20 border-r border-white/5 p-8 flex flex-col">
                                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Signal Context</h3>
                                <h2 className="text-xl font-bold text-white mb-2 leading-tight">{selectedSignal.title}</h2>
                                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest mb-6">
                                    <User size={12} /> {selectedSignal.sender_identifier}
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <div className="absolute inset-0 overflow-y-auto text-sm text-white/60 leading-relaxed pr-2">
                                        {selectedSignal.content}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Chat Interface */}
                            <div className="flex-1 flex flex-col bg-[#050b14] relative">
                                {/* Chat Header */}
                                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                                    <MessageSquare size={16} className="text-blue-400" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Secure Comms Channel</span>
                                </div>

                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {chatMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-white/20">
                                            <HelpCircle size={32} className="mb-2 opacity-50" />
                                            <p className="text-xs uppercase tracking-widest">No inquiries yet</p>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg) => (
                                            <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'titan' ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender_type === 'titan' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none' : 'bg-white/10 border border-white/5 text-gray-200 rounded-tl-none'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] text-white/20 mt-1 uppercase tracking-wider">
                                                    {msg.sender_type === 'titan' ? 'Boardroom' : 'Alien'} • {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Type your inquiry..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-white/20"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={sendingMsg || !newMessage.trim()}
                                            className="p-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {sendingMsg ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const CompanyBadge = ({ asset }) => {
    const [imgError, setImgError] = React.useState(false);

    return (
        <div className="relative group">
            <div className={`w-12 h-12 rounded-full border border-blue-500/30 p-1 flex items-center justify-center overflow-hidden ${imgError ? 'bg-blue-900/20' : 'bg-white'}`}>
                {asset.logo && !imgError ? (
                    <img
                        src={asset.logo}
                        alt={asset.name}
                        className="w-full h-full rounded-full object-contain group-hover:opacity-100 transition-opacity"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-xs font-bold text-blue-300">{asset.name[0]}</span>
                )}
            </div>

            {/* Count Badge */}
            {asset.count > 1 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0a101f] shadow-lg">
                    x{asset.count}
                </div>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-blue-500/30 text-blue-400 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm tracking-widest uppercase">
                {asset.name}
            </div>
        </div>
    );
};

export default BoardroomDashboard;
