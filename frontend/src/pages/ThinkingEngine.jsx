// Visualization component for the AI "Thinking Engine" processing nodes.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Activity, ShieldAlert, Cpu, CheckCircle2, XCircle, Clock, Server, Eye, Zap } from 'lucide-react';

const ThinkingEngine = () => {
    const navigate = useNavigate();
    const [stream, setStream] = useState([]);
    const [stats, setStats] = useState({ total: 0, rejected: 0, approved: 0, processing: 0 });
    const [selectedSignal, setSelectedSignal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeLog, setActiveLog] = useState(null); // Moved up

    /*
    useEffect(() => {
        try {
            const token = localStorage.getItem('thinking_engine_token');
            if (!token) {
                navigate('/thinking-engine/login');
            }
        } catch (e) {
            console.error("Auth Token Access Error", e);
            navigate('/thinking-engine/login');
        }
    }, [navigate]);
    */

    const fetchData = async () => {
        try {
            const [streamRes, statsRes] = await Promise.all([
                fetch('/api/volcano/stream'),
                fetch('/api/volcano/stats')
            ]);

            if (streamRes.ok) {
                const streamData = await streamRes.json();
                setStream(Array.isArray(streamData) ? streamData : []);
            }
            if (statsRes.ok) setStats(await statsRes.json());
            setLoading(false);
        } catch (err) {
            console.error("Neural Uplink Failed:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Live poll
        return () => clearInterval(interval);
    }, []);

    // Live Log Polling Effect (Moved up)
    useEffect(() => {
        let logInterval;
        if (selectedSignal && selectedSignal.status === 'processing') {
            const fetchLogs = async () => {
                try {
                    const res = await fetch(`/api/volcano/logs/${selectedSignal.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setActiveLog(data);
                    }
                } catch (e) {
                    console.error("Log uplink failed", e);
                }
            };
            fetchLogs(); // Immediate
            logInterval = setInterval(fetchLogs, 1000); // Poll every 1s
        } else {
            setActiveLog(null);
        }
        return () => clearInterval(logInterval);
    }, [selectedSignal]);

    // SYNC EFFECT: Keep selectedSignal updated with live stream data
    useEffect(() => {
        if (selectedSignal && stream.length > 0) {
            const updatedSignal = stream.find(s => s.id === selectedSignal.id);
            if (updatedSignal && updatedSignal.status !== selectedSignal.status) {
                // Preserve local analysis log if backend hasn't provided one yet
                setSelectedSignal(prev => ({
                    ...updatedSignal,
                    analysis_log: updatedSignal.analysis_log || prev.analysis_log
                }));
            }
        }
    }, [stream]); // Only trigger when stream updates

    if (loading) return (
        <div className="min-h-screen bg-[#050510] text-purple-500 flex items-center justify-center font-mono">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <BrainCircuit size={48} />
                <span className="uppercase tracking-[0.3em] text-xs">Initializing Neural Lattice...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050510] text-purple-400 font-mono selection:bg-purple-900 selection:text-white flex flex-col overflow-hidden">

            {/* Header */}
            <div className="h-16 border-b border-purple-900/30 bg-black/40 flex items-center justify-between px-8 z-20 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                        <BrainCircuit size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-[0.2em] text-white">Thinking Engine</h1>
                        <p className="text-[10px] text-purple-400 uppercase tracking-widest">Cognitive Processing Unit v2.0</p>
                    </div>
                </div>

                <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold">
                    <div className="flex flex-col items-center">
                        <span className="text-white/40">Total Signals</span>
                        <span className="text-xl text-white">{stats?.total || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white/40">Processing</span>
                        <span className="text-xl text-yellow-500">{stats?.processing || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white/40">Rejected</span>
                        <span className="text-xl text-red-500">{stats?.rejected || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-white/40">Approved</span>
                        <span className="text-xl text-cyan-500">{stats?.approved || 0}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(147,51,234,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                {/* Left Stream */}
                <div className="w-1/3 border-r border-purple-900/30 bg-black/20 flex flex-col relative z-10">
                    <div className="p-4 border-b border-purple-900/20 flex items-center justify-between">
                        <h2 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} /> Neural Stream
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            <span className="text-[9px] text-purple-500/50">ACTIVE</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {Array.isArray(stream) && stream.map(signal => (
                            <div
                                key={signal.id}
                                onClick={() => setSelectedSignal(signal)}
                                className={`p-4 border-b border-purple-900/10 cursor-pointer transition-all hover:bg-purple-900/10 ${selectedSignal?.id === signal.id ? 'bg-purple-900/20 border-l-2 border-l-purple-500' : 'border-l-2 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60 uppercase">
                                        #{signal.id}
                                    </span>
                                    {signal.status === 'processing' && <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1"><Clock size={10} /> THOUGHT PROCESS</span>}
                                    {signal.status === 'volcano_rejected' && <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><XCircle size={10} /> REJECTED</span>}
                                    {signal.status === 'sent_to_boardroom' && <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> APPROVED</span>}
                                    {(signal.status === 'accepted' || signal.status === 'interesting') && <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1"><ShieldAlert size={10} /> BOARDROOM ACTIVE</span>}
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1 truncate">{signal.title}</h3>
                                <div className="flex justify-between items-center text-[10px] text-white/30 uppercase tracking-wider">
                                    <span>From: {signal.sender}</span>
                                    <span>To: {signal.recipient}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Decision Core */}
                <div className="flex-1 bg-black/40 flex flex-col relative z-10">
                    {selectedSignal ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Signal Details */}
                            <div className="p-8 pb-4">
                                <div className="flex items-center gap-2 text-purple-500/50 text-xs uppercase tracking-[0.2em] mb-4">
                                    <Cpu size={14} /> Cognitive Analysis
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">{selectedSignal.title}</h1>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 bg-purple-900/10 border border-purple-900/30 rounded-lg">
                                        <label className="text-[10px] text-purple-500/60 uppercase tracking-widest block mb-1">Source Node</label>
                                        <div className="text-white font-bold">{selectedSignal.sender}</div>
                                    </div>
                                    <div className="p-4 bg-purple-900/10 border border-purple-900/30 rounded-lg">
                                        <label className="text-[10px] text-purple-500/60 uppercase tracking-widest block mb-1">Target Node</label>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            {selectedSignal.recipient_logo && <img src={selectedSignal.recipient_logo} className="w-4 h-4 rounded-full" />}
                                            {selectedSignal.recipient}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AGENT PIPELINE VISUALIZATION (Node-Link Network) */}
                            {selectedSignal.status === 'processing' && activeLog && Array.isArray(activeLog.agents) && (
                                <div className="px-8 py-6">
                                    <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4 pl-1">Active Swarm Network</h3>
                                    <div className="flex items-center justify-between relative px-4">
                                        {/* Connecting Line - Background */}
                                        <div className="absolute left-4 right-4 h-0.5 bg-purple-900/30 rounded top-1/2 -translate-y-1/2 -z-10"></div>

                                        {/* Connecting Line - Progress */}
                                        <div
                                            className="absolute left-4 h-0.5 bg-purple-500 rounded top-1/2 -translate-y-1/2 -z-0 transition-all duration-500"
                                            style={{
                                                width: `${Math.max(0, (activeLog.agents.indexOf(activeLog.current_agent) / (activeLog.agents.length - 1)) * 100)}%`
                                            }}
                                        ></div>

                                        {activeLog.agents.map((agent, idx) => {
                                            const isActive = activeLog.current_agent === agent;
                                            const isDone = activeLog.agents.indexOf(activeLog.current_agent) > idx;

                                            return (
                                                <div key={agent} className="flex flex-col items-center gap-3 relative z-10 group">
                                                    {/* Node Circle */}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                                                        ${isActive ? 'bg-black border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] scale-110' :
                                                            isDone ? 'bg-purple-500 border-purple-500 text-black' :
                                                                'bg-[#050510] border-purple-900/40 text-white/20'}`}>

                                                        {isDone ? <CheckCircle2 size={16} /> :
                                                            isActive ? <Activity size={16} className="text-purple-500 animate-pulse" /> :
                                                                <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>}
                                                    </div>

                                                    {/* Label */}
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 absolute top-10 whitespace-nowrap
                                                        ${isActive ? 'text-purple-400' : isDone ? 'text-purple-500/60' : 'text-white/20'}`}>
                                                        {agent}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {/* Spacer for labels */}
                                    <div className="h-6"></div>
                                </div>
                            )}

                            {/* Analysis Log */}
                            <div className="flex-1 overflow-y-auto px-8 pb-8">
                                <div className="bg-[#0b0b1a] border border-purple-900/30 rounded-xl p-6 shadow-[0_0_30px_rgba(147,51,234,0.1)] relative overflow-hidden group">

                                    {/* Scanline */}
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>

                                    <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Server size={14} /> Thought Trace
                                    </h3>

                                    {/* LIVE OR STATIC LOGS */}
                                    {(selectedSignal.status === 'processing' && activeLog) ? (
                                        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-white/80">
                                            {activeLog.logs && Array.isArray(activeLog.logs) && activeLog.logs.map((log, i) => (
                                                <div key={i} className="mb-1 border-l-2 border-purple-500 pl-3 opacity-80 hover:opacity-100 transition-opacity">
                                                    {log}
                                                </div>
                                            ))}
                                            <div className="animate-pulse text-purple-500 mt-2">_</div>
                                        </div>
                                    ) : selectedSignal.analysis_log ? (
                                        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-white/80">
                                            {selectedSignal.analysis_log}
                                        </div>
                                    ) : (
                                        <div className="text-white/20 italic text-xs">
                                            &gt; No cognitive logs found. Signal predates engine initialization.
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] text-white/30 uppercase tracking-widest block mb-1">Conclusion</span>
                                            <span className={`text-xl font-bold ${selectedSignal.status === 'volcano_rejected' ? 'text-red-500' :
                                                selectedSignal.status === 'sent_to_boardroom' ? 'text-cyan-500' :
                                                    'text-white'
                                                }`}>
                                                {selectedSignal.status.replace('volcano_', '').replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>

                                    </div>
                                </div>

                                {/* Raw Content */}
                                <div className="mt-6 p-6 border border-white/5 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity">
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Raw Data Packet</h4>
                                    <p className="text-xs text-white/60">{selectedSignal.content}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-purple-900/40">
                            <Eye size={64} className="mb-4 opacity-20" />
                            <p className="uppercase tracking-[0.5em] text-sm">Waiting for input...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Thinking Engine Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-red-500 font-mono p-10 overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h1>
                    <div className="border border-red-900 bg-red-900/10 p-4 rounded">
                        <p className="font-bold">{this.state.error && this.state.error.toString()}</p>
                        <pre className="text-xs mt-2 opacity-70 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const ThinkingEngineWithBoundary = () => (
    <ErrorBoundary>
        <ThinkingEngine />
    </ErrorBoundary>
);

export default ThinkingEngineWithBoundary;
