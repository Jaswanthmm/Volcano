// Main interface for Aliens to submit ideas and view their status.
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Send, Database, Shield, LogOut, Loader2, AlertTriangle, CheckCircle2, User, MessageSquare, XCircle, HelpCircle, Activity, Lock } from 'lucide-react';

const AlienDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [ideas, setIdeas] = useState([]);
    const [companies, setCompanies] = useState([]); // List of available Boardrooms
    const [loading, setLoading] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [signalType, setSignalType] = useState('New Feature');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'sending', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [currentView, setCurrentView] = useState('transmit'); // 'transmit' | 'archive'

    // Chat State
    const [showChatModal, setShowChatModal] = useState(false);
    const [selectedSignalForChat, setSelectedSignalForChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    const openChat = async (signal) => {
        setSelectedSignalForChat(signal);
        setShowChatModal(true);
        try {
            const res = await fetch(`/api/messages/${signal.id}`);
            if (res.ok) {
                setChatMessages(await res.json());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedSignalForChat) return;
        setSendingMsg(true);
        try {
            const res = await fetch(`/api/messages/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea_id: selectedSignalForChat.id,
                    sender_type: 'alien',
                    content: newMessage
                })
            });
            if (res.ok) {
                const msg = await res.json();
                setChatMessages([...chatMessages, {
                    id: msg.id,
                    sender_type: 'alien',
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

    // Compute Badges (Gamification)
    const badges = React.useMemo(() => {
        const acceptedMap = {};
        ideas.forEach(idea => {
            if (idea.status === 'accepted') {
                const name = idea.company_name;
                // Use backend provided logo or a fallback if not present (though seeding ensures it)
                const logo = idea.company_logo_url;
                if (!acceptedMap[name]) {
                    acceptedMap[name] = { name, logo, count: 0 };
                }
                acceptedMap[name].count += 1;
            }
        });
        return Object.values(acceptedMap);
    }, [ideas]);

    useEffect(() => {
        // 1. Auth Check
        const storedUser = localStorage.getItem('alien_user');
        if (!storedUser) {
            navigate('/login/alien');
            return;
        }
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        } catch (e) {
            console.error("Auth Data Corrupted", e);
            localStorage.removeItem('alien_user');
            navigate('/login/alien');
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;

        // 2. Fetch Data (Initial Load)
        const fetchData = async () => {
            try {
                const [ideasRes, companiesRes] = await Promise.all([
                    fetch(`/api/ideas/my?identifier=${user.alien_id}`),
                    fetch(`/api/ideas/companies`)
                ]);
                if (ideasRes.ok) setIdeas(await ideasRes.json());
                if (companiesRes.ok) setCompanies(await companiesRes.json());
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // 3. Polling for Status Updates (Async Pipeline)
        const interval = setInterval(() => {
            fetch(`/api/ideas/my?identifier=${user.alien_id}`)
                .then(res => res.ok ? res.json() : [])
                .then(data => {
                    setIdeas(prev => data);
                });
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);

    }, [user]);

    // 4. Polling for Chat Messages (Real-time Uplink)
    useEffect(() => {
        let chatInterval;
        if (showChatModal && selectedSignalForChat) {
            // Immediate fetch on open/change is handled by openChat, but we poll for updates
            chatInterval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/messages/${selectedSignalForChat.id}`);
                    if (res.ok) {
                        const msgs = await res.json();
                        setChatMessages(msgs);
                    }
                } catch (err) {
                    console.error("Chat polling error", err);
                }
            }, 3000);
        }
        return () => clearInterval(chatInterval);
    }, [showChatModal, selectedSignalForChat]);

    const handleLogout = () => {
        localStorage.removeItem('alien_token');
        localStorage.removeItem('alien_user');
        navigate('/');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus('sending');
        setErrorMessage('');

        try {
            const response = await fetch('/api/ideas/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    signal_type: signalType,
                    sender_identifier: user.alien_id,
                    company_name: selectedCompany
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Determine if it was an AI filter blocking execution
                const errorDetail = data.details || data.error || 'Transmission interrupted';
                throw new Error(errorDetail);
            }

            // Success: Add Optimistic "Processing" Idea
            setIdeas(prev => [{
                id: data.signal_id,
                title,
                content,
                signal_type: signalType,
                status: 'processing', // Display as "Sent to Volcano"
                company_name: selectedCompany,
                created_at: new Date().toISOString()
            }, ...prev]);

            setSubmitStatus('success');
            setTitle('');
            setContent('');
            setSignalType('New Feature');
            setSelectedCompany('');
            setSearchQuery('');

            // Reset status after 3s
            setTimeout(() => setSubmitStatus(null), 3000);

        } catch (err) {
            console.error("Submission error:", err);
            setErrorMessage(err.message);
            setSubmitStatus('error');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin h-12 w-12" />
                <p className="tracking-widest animate-pulse">ESTABLISHING SECURE UPLINK...</p>
            </div>
        </div>
    );

    // Filter Logic
    const visibleIdeas = currentView === 'transmit'
        ? ideas.filter(i => i.status === 'pending' || i.status === 'processing') // Show processing/pending in Transmit
        : currentView === 'active'
            ? ideas.filter(i => i.status === 'sent_to_boardroom' || i.status === 'interesting') // Show sent in Active
            : ideas.filter(i => i.status === 'accepted' || i.status === 'rejected' || i.status === 'volcano_rejected'); // Show final rejections in Archive

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative selection:bg-green-900 selection:text-white">

            {/* Background Details */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-900/10 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50"></div>
            </div>

            {/* Sidebar / Navigation */}
            <div className="fixed left-0 top-0 bottom-0 w-64 border-r border-green-500/20 bg-black/90 backdrop-blur-xl p-6 flex flex-col z-20">
                <div className="mb-10 flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400">
                        <Radio size={20} />
                    </div>
                    <div>
                        <h1 className="font-bold tracking-widest text-sm">UPLINK NODE</h1>
                        <p className="text-[10px] text-green-500/50">v3.2 ASYNC</p>
                    </div>
                </div>

                <div className="space-y-1 mb-auto">
                    <div
                        onClick={() => setCurrentView('transmit')}
                        className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-xs tracking-widest flex items-center gap-3 font-bold ${currentView === 'transmit' ? 'bg-green-900/20 border border-green-500/30 text-green-400' : 'text-green-600 hover:text-green-400 hover:bg-white/5'}`}
                    >
                        <Send size={16} /> TRANSMIT
                    </div>
                    <div
                        onClick={() => setCurrentView('active')}
                        className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-xs tracking-widest flex items-center gap-3 font-bold ${currentView === 'active' ? 'bg-green-900/20 border border-green-500/30 text-green-400' : 'text-green-600 hover:text-green-400 hover:bg-white/5'}`}
                    >
                        <Activity size={16} /> BOARDROOM ACTIVE
                    </div>
                    <div
                        onClick={() => setCurrentView('archive')}
                        className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-xs tracking-widest flex items-center gap-3 font-bold ${currentView === 'archive' ? 'bg-green-900/20 border border-green-500/30 text-green-400' : 'text-green-600 hover:text-green-400 hover:bg-white/5'}`}
                    >
                        <Database size={16} /> ARCHIVE LOGS
                    </div>
                    <div className="px-4 py-3 rounded-lg hover:bg-white/5 text-green-600 hover:text-green-400 transition-colors text-xs tracking-widest flex items-center gap-3 cursor-not-allowed opacity-50">
                        <Shield size={16} /> PROTOCOLS
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-green-500/20">
                    <Link to={`/alien/${user?.alien_id}`} className="flex items-center gap-3 mb-4 group cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center group-hover:border-green-400 transition-colors">
                            <User size={14} className="group-hover:text-green-400 transition-colors" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-green-400 font-bold truncate w-32 group-hover:text-green-300 transition-colors">{user?.alien_id}</p>
                            <p className="text-[9px] text-green-600">VIEW ID CARD</p>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 border border-red-500/30 text-red-500/60 hover:text-red-400 hover:bg-red-900/10 rounded text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                        <LogOut size={12} /> TERMINATE LINK
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 p-8 relative z-10 max-w-full">

                {/* Header */}
                <header className="mb-12 border-b border-green-500/20 pb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black uppercase text-white tracking-widest mb-1">
                            {currentView === 'transmit' ? 'Frequency Control' : currentView === 'active' ? 'Active Uplinks' : 'Signal Archive'}
                        </h2>
                        <div className="flex items-center gap-3 mt-4">
                            {badges.length > 0 ? (
                                badges.map((badge, idx) => (
                                    <div key={idx} className="relative group cursor-help">
                                        <div className="w-10 h-10 rounded-full bg-white border border-green-500/50 p-0.5 overflow-hidden flex items-center justify-center">
                                            {badge.logo ? (
                                                <img src={badge.logo} alt={badge.name} className="w-full h-full rounded-full object-contain group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {badge.name[0]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Count Badge */}
                                        {badge.count > 1 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-black text-[10px] font-bold flex items-center justify-center border-2 border-black z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                                x{badge.count}
                                            </div>
                                        )}

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-green-500/30 text-green-400 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm tracking-widest uppercase">
                                            {badge.name} Asset
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-green-600 text-xs italic tracking-widest opacity-50">NO ASSETS SECURED</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-green-500/40 uppercase tracking-[0.2em] mb-1">Network Status</p>
                        <div className="flex items-center justify-end gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-green-400 font-bold">ONLINE</span>
                        </div>
                    </div>
                </header>

                <div className="flex gap-8">
                    {/* LEFT PANEL: INPUT (Only on Transmit) */}
                    {currentView === 'transmit' && (
                        <div className="w-5/12">
                            <form onSubmit={handleSubmit} className="bg-green-900/5 border border-green-500/20 p-6 rounded-xl space-y-6 relative overflow-hidden">
                                {submitStatus === 'sending' && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-green-500">
                                        <Loader2 className="animate-spin mb-2" />
                                        <span className="text-xs tracking-widest animate-pulse">ENCRYPTING SIGNAL...</span>
                                    </div>
                                )}
                                {submitStatus === 'success' && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col items-center justify-center text-green-400">
                                        <CheckCircle2 size={48} className="mb-4" />
                                        <span className="text-sm font-bold tracking-widest">SIGNAL DISPATCHED</span>
                                    </div>
                                )}
                                {submitStatus === 'error' && (
                                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-10 flex flex-col items-center justify-center text-red-500 p-6 text-center">
                                        <XCircle size={48} className="mb-4" />
                                        <span className="text-sm font-bold tracking-widest mb-2">TRANSMISSION FAILED</span>
                                        <p className="text-xs opacity-70 border border-red-500/30 p-2 rounded bg-red-900/10">
                                            {errorMessage}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSubmitStatus(null)}
                                            className="mt-4 text-[10px] underline hover:text-red-400"
                                        >
                                            RETRY HANDSHAKE
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-green-500/60 mb-2">Target Boardroom</label>
                                    <SearchableDropdown
                                        companies={companies}
                                        selectedCompany={selectedCompany}
                                        onSelect={(name) => setSelectedCompany(name)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-green-500/60 mb-2">Signal Core</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-black border border-green-500/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500 transition-colors uppercase tracking-wider placeholder-green-800"
                                        placeholder="Operation Name..."
                                        maxLength={15}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-green-500/60 mb-2">Payload Details</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full bg-black border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-300 focus:outline-none focus:border-green-500 transition-colors h-32 resize-none custom-scrollbar"
                                        placeholder="Describe the opportunity..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-green-500/60 mb-2">Classification</label>
                                    <div className="flex bg-black rounded-lg p-1 border border-green-500/20">
                                        {['New Feature', 'Bug', 'Strategy'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setSignalType(type)}
                                                className={`flex-1 py-2 text-[9px] uppercase font-bold rounded transition-all ${signalType === type ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'text-green-600 hover:text-green-400'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!title || !content || !selectedCompany}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-bold tracking-[0.2em] uppercase rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-2"
                                >
                                    <Radio size={16} className={submitStatus === 'sending' ? 'animate-spin' : ''} />
                                    Broadcast Signal
                                </button>
                            </form>
                        </div>
                    )}



                    {/* RIGHT PANEL: LOGS */}
                    <div className={currentView === 'transmit' ? "w-7/12" : "w-full"}>
                        <div className="bg-black/50 border border-green-500/10 rounded-xl p-6 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Signal Telemetry
                                </h3>
                                {/* Search or Filter could go here */}
                            </div>

                            <div className="space-y-4">
                                {visibleIdeas.length === 0 ? (
                                    <div className="text-center py-10 text-green-500/30 text-xs">
                                        <Database size={32} className="mx-auto mb-3 opacity-50" />
                                        NO LOGS FOUND
                                    </div>
                                ) : (
                                    visibleIdeas.map(idea => (
                                        <div key={idea.id} className={`p-4 bg-green-900/5 border rounded-lg transition-all group ${idea.status === 'volcano_rejected' ? 'border-red-500/30 hover:border-red-500/50' : 'border-green-500/10 hover:border-green-500/30'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded border border-green-500/20">{idea.signal_type || 'Signal'}</span>
                                                    <h4 className="font-bold text-green-400 text-sm group-hover:text-green-300">{idea.title}</h4>
                                                </div>
                                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${idea.status === 'processing' ? 'border-yellow-500/20 text-yellow-500 animate-pulse' :
                                                    idea.status === 'sent_to_boardroom' ? 'border-green-500/20 text-green-400' :
                                                        idea.status === 'volcano_rejected' ? 'border-red-500/20 text-red-500' :
                                                            'border-gray-500/20 text-gray-500'
                                                    }`}>
                                                    {idea.status === 'processing' && <Loader2 size={10} className="animate-spin" />}
                                                    {idea.status === 'processing' ? 'SENT TO VOLCANO' :
                                                        idea.status === 'sent_to_boardroom' ? 'SENT TO BOARDROOM' :
                                                            idea.status === 'volcano_rejected' ? 'REJECTED BY VOLCANO' : idea.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-green-500/40 mt-3">
                                                <span className="flex items-center gap-1 uppercase tracking-widest">
                                                    TO: {idea.company_id ? (
                                                        <Link to={`/boardroom/${idea.company_id}`} className="hover:text-green-400 hover:underline transition-colors" onClick={(e) => e.stopPropagation()}>
                                                            {idea.company_name}
                                                        </Link>
                                                    ) : (
                                                        idea.company_name
                                                    )}
                                                </span>
                                                <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                                            </div>

                                            {/* Action Buttons */}
                                            {(idea.status === 'sent_to_boardroom' || idea.status === 'interesting' || idea.status === 'accepted' || idea.status === 'volcano_rejected' || idea.status === 'rejected') ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openChat(idea); }}
                                                    className={`mt-3 w-full py-2 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-colors ${idea.status === 'volcano_rejected' || idea.status === 'rejected'
                                                        ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'
                                                        : 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400'
                                                        }`}
                                                >
                                                    <MessageSquare size={12} /> {(idea.status === 'volcano_rejected' || idea.status === 'rejected') ? 'VIEW TRANSMISSION LOG' : 'COMM LINK'}
                                                </button>
                                            ) : (
                                                <div className="mt-3 w-full py-2 bg-white/5 border border-white/5 rounded text-[10px] text-white/20 text-center flex items-center justify-center gap-2 cursor-not-allowed">
                                                    <Shield size={12} /> {idea.status === 'processing' ? 'AWAITING VOLCANO PROTOCOL...' : 'SECURE CHANNEL LOCKED'}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>


            {/* --- ALIEN CHAT MODAL --- */}
            {
                showChatModal && selectedSignalForChat && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                        <div className="bg-[#050b14] border border-green-500/30 w-full max-w-4xl rounded-xl shadow-2xl relative overflow-hidden flex h-[600px] font-mono">

                            {/* Modal Close */}
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="absolute top-4 right-4 text-green-500/30 hover:text-green-500 transition-colors z-50"
                            >
                                <XCircle size={24} />
                            </button>

                            {/* Left: Context Summary */}
                            <div className="w-1/3 bg-green-900/10 border-r border-green-500/20 p-8 flex flex-col">
                                <h3 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-4">Transmission Context</h3>
                                <h2 className="text-xl font-bold text-green-400 mb-2 leading-tight">{selectedSignalForChat.title}</h2>
                                <div className="flex items-center gap-2 text-green-500/50 text-[10px] uppercase tracking-widest mb-6">
                                    <Shield size={12} /> {(selectedSignalForChat.status === 'volcano_rejected' || selectedSignalForChat.status === 'rejected') ? 'SIGNAL REJECTED' : `TO: ${selectedSignalForChat.company_name}`}
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <div className="absolute inset-0 overflow-y-auto text-sm text-green-300/60 leading-relaxed pr-2 custom-scrollbar whitespace-pre-wrap">
                                        {selectedSignalForChat.content}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Chat Interface */}
                            <div className="flex-1 flex flex-col bg-black relative">
                                {/* Chat Header */}
                                <div className="p-4 border-b border-green-500/20 bg-green-900/5 flex items-center gap-3">
                                    <MessageSquare size={16} className="text-green-500" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">
                                        {(selectedSignalForChat.status === 'volcano_rejected' || selectedSignalForChat.status === 'rejected') ? 'TRANSMISSION LOG' : `Secure Uplink: ${selectedSignalForChat.company_name}`}
                                    </span>
                                </div>

                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {chatMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-green-500/20">
                                            <HelpCircle size={32} className="mb-2 opacity-50" />
                                            <p className="text-xs uppercase tracking-widest">No transmissions yet</p>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg) => (
                                            <div key={msg.id} className={`flex flex-col ${msg.sender_type === 'alien' ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.sender_type === 'alien' ? 'bg-green-900/20 border border-green-500/30 text-green-100 rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] text-green-500/30 mt-1 uppercase tracking-wider">
                                                    {msg.sender_type === 'alien' ? 'You' : 'Boardroom'} • {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input Area */}
                                {/* Input Area */}
                                <div className="p-4 border-t border-green-500/20 bg-green-900/5">
                                    {(selectedSignalForChat.status === 'rejected' || selectedSignalForChat.status === 'volcano_rejected') ? (
                                        <div className="text-center py-2 border border-red-500/20 bg-red-900/10 rounded-lg">
                                            <p className="text-[10px] text-red-500/60 uppercase tracking-widest flex items-center justify-center gap-2">
                                                <XCircle size={12} />
                                                CHANNEL TERMINATED - LINK SEVERED
                                            </p>
                                        </div>
                                    ) : chatMessages.length === 0 ? (
                                        <div className="text-center py-2">
                                            <p className="text-[10px] text-green-500/40 uppercase tracking-widest flex items-center justify-center gap-2">
                                                <Lock size={12} />
                                                Uplink Standby - Awaiting Boardroom Initiation
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                                placeholder="Type your response..."
                                                className="flex-1 bg-black/40 border border-green-500/20 rounded-lg px-4 py-3 text-sm text-green-300 focus:outline-none focus:border-green-500/50 transition-all placeholder-green-800"
                                            />
                                            <button
                                                onClick={sendMessage}
                                                disabled={sendingMsg || !newMessage.trim()}
                                                className="p-3 rounded-lg bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {sendingMsg ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>

                        </div>
                    </div>
                )
            }
        </div >
    );
};

const CompanyBadge = ({ badge }) => {
    const [imgError, setImgError] = React.useState(false);

    return (
        <div className="relative group cursor-help">
            <div className={`w-10 h-10 rounded-full border border-green-500/50 p-0.5 overflow-hidden flex items-center justify-center ${imgError ? 'bg-green-900/20' : 'bg-white'}`}>
                {badge.logo && !imgError ? (
                    <img
                        src={badge.logo}
                        alt={badge.name}
                        className="w-full h-full rounded-full object-contain group-hover:opacity-100 transition-opacity"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-white">
                        {badge.name[0]?.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Count Badge */}
            {badge.count > 1 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-black text-[10px] font-bold flex items-center justify-center border-2 border-black z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                    x{badge.count}
                </div>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-green-500/30 text-green-400 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm tracking-widest uppercase">
                {badge.name} Asset
            </div>
        </div>
    );
};

const SearchableDropdown = ({ companies, selectedCompany, onSelect }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const dropdownRef = React.useRef(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filtered = (companies || []).filter(c =>
        c.name && c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                className="w-full bg-black border border-green-500/20 rounded-lg px-4 py-3 text-sm text-white flex items-center justify-between cursor-pointer hover:border-green-500/50 transition-colors uppercase tracking-wider outline-none focus:border-green-500"
            >
                <div className="flex items-center gap-2">
                    {selectedCompany ? (
                        <>
                            <span>{selectedCompany}</span>
                        </>
                    ) : (
                        <span className="text-green-800">SELECT UPLINK TARGET...</span>
                    )}
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#050b14] border border-green-500/30 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="sticky top-0 bg-[#050b14] p-2 border-b border-green-500/10 z-10">
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="SEARCH FREQUENCY..."
                            className="w-full bg-black/50 border border-green-500/20 rounded px-3 py-2 text-xs text-green-400 placeholder-green-500/30 focus:outline-none focus:border-green-500/50 uppercase tracking-widest"
                            autoComplete="off"
                        />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-[10px] text-green-500/30 text-center italic">
                            NO UPLINK FOUND
                        </div>
                    ) : (
                        filtered.map(c => (
                            <div
                                key={c.id}
                                onClick={() => {
                                    onSelect(c.name);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className="px-4 py-3 hover:bg-green-500/10 cursor-pointer flex items-center gap-3 border-b border-green-500/10 last:border-0 transition-colors"
                            >
                                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{c.name}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default AlienDashboard;
