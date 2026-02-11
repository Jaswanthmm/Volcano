// Public landing page introducing the Volcano ecosystem.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, File, Lock, DollarSign, User, Activity, Box, Shield, Check, DivideCircle } from 'lucide-react';

const LandingPage = () => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [hoveredSide, setHoveredSide] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const SYSTEM_LOGS = [
    "PROTOCOL_ACTIVE: Alien Transmission Sync (0x8F2)",
    "EXCHANGE_VOLUME: $18.2M Disbursed in Q4",
    "ENTITY_VETTING: Neural filters at 99.98% accuracy",
    "MARKET_ALERT: High demand for 'Sustainable Logic' Innovation",
    "NODE_STATUS: Alien edge network optimal"
  ];

  const STATS = [
    { label: "Active Aliens", value: "9,429", icon: <Globe size={24} /> },
    { label: "Ideas Transferred", value: "8,204", icon: <File size={24} /> },
    { label: "Capital Disbursed", value: "$12.4M", icon: <Lock size={24} /> },
    { label: "Active Boardrooms", value: "1,204", icon: <Box size={24} /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % SYSTEM_LOGS.length);
    }, 5000);

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="relative min-h-screen text-white bg-black overflow-x-hidden selection:bg-green-500 selection:text-black">

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Spotlight Effect */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
          }}
        />

        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(3)',
            transformOrigin: 'top center',
            maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
          }}>
        </div>

        {/* Floating Particles/Nodes */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float blur-sm"
            style={{
              top: `${Math.random() * 100}vh`,
              left: `${Math.random() * 100}vw`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${10 + Math.random() * 20}s`
            }}
          />
        ))}

        {/* Subtle Gradient Spots */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Dynamic Header Badge */}
      <div className="relative z-10 pt-24 md:pt-32 flex justify-center px-6">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass border-white/10 animate-fadeInUp">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/60">Feel the heat of innovation</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-12 pb-20 md:pb-32 text-center max-w-7xl mx-auto overflow-hidden">
        <h1 className="text-5xl sm:text-7xl md:text-9xl lg:text-[11rem] font-space font-extrabold leading-[1] tracking-tightest mb-8 md:mb-12 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          VOLCANO
        </h1>

        <p className="text-base sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-16 md:mb-24 leading-relaxed font-light px-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          Standardizing the interface between <span className="text-white font-medium">outlier intelligence</span> and <span className="text-white font-medium">industrial scale</span>. Secure, anonymous, and impactful.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8 px-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <Link to="/login/alien" className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            Login as Alien
          </Link>
          <Link to="/login/boardroom" className="w-full sm:w-auto px-10 py-5 glass border-white/20 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/5 transition-all hover:scale-105 active:scale-95">
            Enter Boardroom
          </Link>
        </div>
      </section>

      {/* Network Stats Section */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto border-y border-white/5 bg-white/[0.01]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat, idx) => (
            <div key={idx} className="text-center group animate-fadeInUp" style={{ animationDelay: `${0.1 * idx}s` }}>
              <div className="text-white/20 flex justify-center mb-4 transition-colors group-hover:text-white/60">
                {stat.icon}
              </div>
              <div className="text-2xl md:text-4xl font-space font-bold tracking-tight mb-2">{stat.value}</div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Protocol Selector */}
      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20 md:mb-32">
          <h2 className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20 mb-6">Choose Your Protocol</h2>
          <div className="h-[1px] w-12 mx-auto bg-white/20"></div>
        </div>

        <div className="glass rounded-[2rem] md:rounded-[4rem] border-white/5 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative shadow-2xl">

          {/* Vertical Divider */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-white/5 hidden md:block z-20">
            <div className="w-full h-1/4 bg-white/40 animate-scanline absolute top-0"></div>
          </div>

          {/* ALIEN SIDE */}
          <div
            className={`relative p-10 md:p-24 nexus-transition cursor-default group border-b md:border-b-0 md:border-r border-white/5 ${hoveredSide === 'alien' ? 'bg-purple-500/[0.03]' : ''}`}
            onMouseEnter={() => setHoveredSide('alien')}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-12">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl nexus-transition ${hoveredSide === 'alien' ? 'alien-gradient text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] scale-110' : 'bg-white/5 text-white/20'}`}>
                  <User size={28} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-400 block mb-1">Status: Vanguard</span>
                  <h3 className="text-3xl md:text-5xl font-space font-bold tracking-tight">ALIEN</h3>
                </div>
              </div>

              <p className="text-lg text-gray-500 leading-relaxed mb-12 font-light">
                For the architects of the unusual. Canalize your raw innovation into tangible impact. Scale your value without compromising your sovereignty.
              </p>

              <div className="space-y-8">
                {[
                  { label: "Impact", val: "On Real World", icon: <Shield size={16} /> },
                  { label: "Value", val: "Where it Counts", icon: <DivideCircle size={16} /> }
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 transition-all duration-700 ${hoveredSide === 'alien' ? 'translate-x-2 opacity-100' : 'opacity-40'}`}>
                    <div className="w-8 h-8 rounded-full border border-purple-500/20 flex items-center justify-center text-[10px] text-purple-400">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-gray-600 mb-1">{item.label}</div>
                      <div className="text-sm font-bold">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOARDROOM SIDE */}
          <div
            className={`relative p-10 md:p-24 nexus-transition cursor-default group ${hoveredSide === 'boardroom' ? 'bg-sky-500/[0.03]' : ''}`}
            onMouseEnter={() => setHoveredSide('boardroom')}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-12">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl nexus-transition ${hoveredSide === 'boardroom' ? 'titan-gradient text-white shadow-[0_0_40px_rgba(14,165,233,0.4)] scale-110' : 'bg-white/5 text-white/20'}`}>
                  <Box size={28} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-sky-400 block mb-1">Status: Industrial</span>
                  <h3 className="text-3xl md:text-5xl font-space font-bold tracking-tight">BOARDROOM</h3>
                </div>
              </div>

              <p className="text-lg text-gray-500 leading-relaxed mb-12 font-light">
                For industrial architects. Harness outlier innovation to fuel exponential growth. Bypass internal friction and scale your competitive advantage.
              </p>

              <div className="space-y-8">
                {[
                  { label: "Efficiency", val: "Pre-Vetted Flow", icon: <Check size={16} /> },
                  { label: "Innovation Capture", val: "At your Fingertips", icon: <Lock size={16} /> }
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 transition-all duration-700 ${hoveredSide === 'boardroom' ? '-translate-x-2 opacity-100' : 'opacity-40'}`}>
                    <div className="w-8 h-8 rounded-full border border-sky-500/20 flex items-center justify-center text-[10px] text-sky-400">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-widest text-gray-600 mb-1">{item.label}</div>
                      <div className="text-sm font-bold">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Action Area */}
      <section className="relative z-10 py-40 px-6 text-center bg-white/[0.02] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-7xl font-space font-black tracking-tightest mb-12 uppercase leading-none">
            Scale the <br className="hidden md:block" /> Impossible.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/login/alien" className="w-full sm:w-auto px-12 py-6 alien-gradient rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:scale-105 transition-all">
              Login as Alien
            </Link>
            <Link to="/login/boardroom" className="w-full sm:w-auto px-12 py-6 glass border-white/10 rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-white/10 transition-all">
              Enter Boardroom
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 bg-black/80 border-t border-white/5 pt-20 pb-32 px-6 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-24">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-space font-bold mb-6">VOLCANO</h3>
            <p className="text-gray-500 font-light leading-relaxed max-w-sm">
              The neural interface for outlier innovation. Connecting the fringe to the core.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Alien Protocol</h4>
            <ul className="space-y-4 text-sm font-light text-gray-400">
              <li><Link to="/login/alien" className="hover:text-green-400 transition-colors">Node Registration</Link></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">Signal Submission</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">Bounty Board</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Boardroom</h4>
            <ul className="space-y-4 text-sm font-light text-gray-400">
              <li><Link to="/login/boardroom" className="hover:text-sky-400 transition-colors">Access Boardroom</Link></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Intelligence Feed</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Feel the heat</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase tracking-widest text-gray-600">
          <div>© 2026 Volcano Network</div>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Protocol</a>
          </div>
        </div>
      </footer>

      {/* Global Status Bar */}
      <div className="fixed bottom-0 left-0 w-full glass border-t border-white/10 py-3 px-6 md:px-12 flex items-center justify-between z-[100] backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600 hidden sm:inline">System Log:</span>
          </div>
          <span className="text-[9px] font-bold text-white/30 font-mono truncate max-w-[200px] md:max-w-none">
            {SYSTEM_LOGS[tickerIndex]}
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-10 text-[8px] font-black uppercase tracking-[0.5em] text-white/5 font-mono">
          <span>NODES: 1,429</span>
          <span>LATENCY: 0.12MS</span>
          <span>UPTIME: 100%</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
