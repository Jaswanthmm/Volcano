import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Send, Database, Shield, LogOut, Loader2, AlertTriangle, CheckCircle2, User } from 'lucide-react';

const AlienDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [ideas, setIdeas] = useState([]);
    const [companies, setCompanies] = useState([]); // List of available Boardrooms
    const [loading, setLoading] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'sending', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [currentView, setCurrentView] = useState('transmit'); // 'transmit' | 'archive'

    // Compute Badges (Gamification)
    const badges = React.useMemo(() => {
        const acceptedMap = {};
        ideas.forEach(idea => {
            if (idea.status === 'accepted') {
                const name = idea.company_name;
                acceptedMap[name] = (acceptedMap[name] || 0) + 1;
            }
        });
        return Object.entries(acceptedMap).map(([name, count]) => ({ name, count }));
    }, [ideas]);

    useEffect(() => {
        // 1. Auth Check
        const storedUser = localStorage.getItem('alien_user');
        if (!storedUser) {
            navigate('/login/alien');
            return;
        }
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // 2. Fetch Data
        Promise.all([
            fetch(`http://127.0.0.1:5000/api/ideas/my?identifier=${userData.alien_id}`),
            fetch(`http://127.0.0.1:5000/api/ideas/companies`)
        ])
            .then(async ([ideasRes, companiesRes]) => {
                if (ideasRes.ok) setIdeas(await ideasRes.json());
                if (companiesRes.ok) setCompanies(await companiesRes.json());
            })
            .finally(() => setLoading(false));

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('alien_token');
        localStorage.removeItem('alien_user');
        navigate('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus('sending');

        try {
            const response = await fetch('http://127.0.0.1:5000/api/ideas/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content,
                    sender_identifier: user.alien_id,
                    company_name: selectedCompany
                }),
            });

            if (!response.ok) throw new Error('Transmission interrupted');

            // Success Update
            const newSignal = await response.json();
            // Optimistic update or refetch
            setIdeas([{
                id: newSignal.signal_id,
                title,
                content,
                status: 'pending',
                company_name: selectedCompany,
                created_at: new Date().toISOString()
            }, ...ideas]);

            setSubmitStatus('success');
            setTitle('');
            setContent('');
            setSelectedCompany('');
            setSearchQuery('');

            // Reset status after 3s
            setTimeout(() => setSubmitStatus(null), 3000);

        } catch (err) {
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
        ? ideas.filter(i => i.status === 'pending')
        : ideas.filter(i => i.status !== 'pending');

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
                        <p className="text-[10px] text-green-500/50">v3.1 ONLINE</p>
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center">
                            <User size={14} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-green-400 font-bold truncate w-32">{user?.alien_id}</p>
                            <p className="text-[9px] text-green-600">CONNECTED</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 border border-red-500/30 text-red-500/60 hover:text-red-400 hover:bg-red-900/10 rounded text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                        <LogOut size={12} /> TERMINATE LINK
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 p-8 relative z-10 max-w-5xl">

                {/* Header */}
                <header className="mb-12 border-b border-green-500/20 pb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black uppercase text-white tracking-widest mb-1">
                            {currentView === 'transmit' ? 'Frequency Control' : 'Signal Archive'}
                        </h2>
                        <div className="flex items-center gap-4 mt-4">
                            {badges.length > 0 ? (
                                badges.map((badge, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 px-3 py-1.5 rounded-full">
                                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-white border border-green-500/50">
                                            {badge.name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-green-500/70 uppercase tracking-wider leading-none">ASSET</span>
                                            <span className="text-xs font-bold text-green-300 leading-none">{badge.count}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-green-600 text-xs italic">No assets acquired yet.</p>
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
                            <span className="text-xs font-bold text-green-400">OPTIMAL</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Submission Panel (Only visible in Transmit Mode) */}
                    {currentView === 'transmit' && (
                        <div className="lg:col-span-2 space-y-8">

                            {/* New Signal Form */}
                            <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-green-500/10 group-hover:text-green-500/20 transition-colors">
                                    <Send size={80} strokeWidth={1} />
                                </div>

                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-green-500 block"></span>
                                    NEW SIGNAL
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-green-500/60 mb-2 font-bold">Signal Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-green-900/10 border border-green-500/20 rounded p-3 text-green-300 focus:outline-none focus:border-green-500/50 focus:bg-green-900/20 transition-all font-mono text-sm placeholder-green-800"
                                            placeholder="Enter abstract..."
                                        />
                                    </div>

                                    <div className="relative">
                                        <label className="block text-[10px] uppercase tracking-widest text-green-500/60 mb-2 font-bold">Target Boardroom</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setIsDropdownOpen(true);
                                                    if (selectedCompany) setSelectedCompany(''); // Reset selection if user changes input
                                                }}
                                                onFocus={() => setIsDropdownOpen(true)}
                                                // onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay to allow click
                                                className="w-full bg-green-900/10 border border-green-500/20 rounded p-3 text-green-300 focus:outline-none focus:border-green-500/50 focus:bg-green-900/20 transition-all font-mono text-sm placeholder-green-800/50"
                                                placeholder="Type to search node..."
                                            />
                                            {isDropdownOpen && (
                                                <div className="absolute z-50 left-0 right-0 mt-1 bg-black border border-green-500/30 rounded shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                                    {companies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                                        <div className="p-3 text-green-500/30 text-xs italic">No nodes found.</div>
                                                    ) : (
                                                        companies
                                                            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                            .map(c => (
                                                                <div
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        setSelectedCompany(c.name);
                                                                        setSearchQuery(c.name);
                                                                        setIsDropdownOpen(false);
                                                                    }}
                                                                    className="p-3 hover:bg-green-500/10 cursor-pointer text-green-400 text-sm border-b border-green-500/10 last:border-none"
                                                                >
                                                                    {c.name}
                                                                </div>
                                                            ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-green-500/60 mb-2 font-bold">Data Payload</label>
                                        <textarea
                                            required
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={5}
                                            className="w-full bg-green-900/10 border border-green-500/20 rounded p-3 text-green-300 focus:outline-none focus:border-green-500/50 focus:bg-green-900/20 transition-all font-mono text-sm placeholder-green-800"
                                            placeholder="Describe your innovation..."
                                        />
                                    </div>

                                    <div className="pt-4 flex items-center justify-between">
                                        {submitStatus === 'success' && (
                                            <span className="text-green-400 text-xs flex items-center gap-2 animate-pulse">
                                                <CheckCircle2 size={14} /> TRANSMISSION SUCCESSFUL
                                            </span>
                                        )}
                                        {submitStatus === 'error' && (
                                            <span className="text-red-400 text-xs flex items-center gap-2">
                                                <AlertTriangle size={14} /> ERROR IN UPLINK
                                            </span>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={submitStatus === 'sending'}
                                            className="ml-auto px-6 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 hover:text-green-300 rounded font-bold text-xs tracking-[0.2em] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitStatus === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            BROADCAST
                                        </button>
                                    </div>
                                </form>
                            </div>

                        </div>
                    )}

                    {/* History / Log Panel */}
                    <div className={`${currentView === 'transmit' ? '' : 'col-span-3'} space-y-6`}>
                        <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-6 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 sticky top-0 bg-black/80 p-2 -mx-2 -mt-2 backdrop-blur z-10">
                                <span className="w-1 h-6 bg-green-500/50 block"></span>
                                {currentView === 'transmit' ? 'TRANSMISSION LOG' : 'SIGNAL ARCHIVE'}
                            </h3>

                            <div className="space-y-4">
                                {visibleIdeas.length === 0 ? (
                                    <div className="text-center py-10 text-green-500/30 text-xs">
                                        <Database size={32} className="mx-auto mb-3 opacity-50" />
                                        NO LOGS FOUND
                                    </div>
                                ) : (
                                    visibleIdeas.map(idea => (
                                        <div key={idea.id} className="p-4 bg-green-900/5 border border-green-500/10 rounded-lg hover:border-green-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-green-400 text-sm group-hover:text-green-300">{idea.title}</h4>
                                                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${idea.status === 'pending' ? 'border-yellow-500/20 text-yellow-500/80' :
                                                    idea.status === 'accepted' ? 'border-blue-500/20 text-blue-400' :
                                                        'border-red-500/20 text-red-500'
                                                    }`}>
                                                    {idea.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-green-500/40 mt-3">
                                                <span className="flex items-center gap-1 uppercase tracking-widest">
                                                    TO: {idea.company_name}
                                                </span>
                                                <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {idea.potential_value && (
                                                <div className="mt-2 pt-2 border-t border-green-500/10 flex items-center gap-2">
                                                    <span className="text-[10px] text-green-300/60 font-mono">EST. VAL: {idea.potential_value}</span>
                                                    {idea.tags && (Array.isArray(idea.tags) ? idea.tags : idea.tags.split(',')).slice(0, 2).map((tag, i) => (
                                                        <span key={i} className="text-[9px] px-1 bg-green-500/10 rounded text-green-500/50">{tag.trim()}</span>
                                                    ))}
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
        </div>
    );
};

export default AlienDashboard;
