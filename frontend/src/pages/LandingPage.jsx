
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb, CheckCircle2, Building2, DollarSign,
  ArrowRight, Shield, Zap, TrendingUp, Users, Lock,
  Activity, Code
} from 'lucide-react';

const LandingPage = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- SIGNAL NETWORK ANIMATION ---
    const canvas = document.getElementById('signal-network');
    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    let lines = [];
    let signals = [];
    let animationFrameId;

    const initNetwork = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      nodes = [];
      lines = [];
      signals = [];

      // Create Nodes
      const nodeCount = Math.floor((width * height) / 25000); // Density
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height
        });
      }

      // Create Connections (Proximity)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) { // Connection threshold
            lines.push({ p1: i, p2: j, dist });
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      lines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(nodes[line.p1].x, nodes[line.p1].y);
        ctx.lineTo(nodes[line.p2].x, nodes[line.p2].y);
        ctx.stroke();
      });

      // Draw Nodes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Manage Signals
      if (Math.random() < 0.05) { // Spawn rate
        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        if (randomLine) {
          signals.push({
            line: randomLine,
            progress: 0,
            speed: 0.005 + Math.random() * 0.01 // Slow motion speed
          });
        }
      }

      // Update & Draw Signals
      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.progress += s.speed;

        if (s.progress >= 1) {
          signals.splice(i, 1);
          continue;
        }

        const p1 = nodes[s.line.p1];
        const p2 = nodes[s.line.p2];
        const x = p1.x + (p2.x - p1.x) * s.progress;
        const y = p1.y + (p2.y - p1.y) * s.progress;

        // Draw Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 1)'); // Red Core
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Fade
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    initNetwork();
    draw();

    const handleResize = () => initNetwork();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- TYPING ANIMATION ---
  const [heroText, setHeroText] = useState("YOUR ");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    const words = ["MIND", "THOUGHTS", "IDEAS"];
    const i = loopNum % words.length;
    const fullText = `YOUR ${words[i]}`;

    let speed = 150;
    if (isDeleting) speed = 75;
    if (!isDeleting && heroText === fullText) speed = 2000;

    const tick = setTimeout(() => {
      setHeroText((prev) => {
        if (isDeleting) {
          if (prev === "YOUR ") {
            setIsDeleting(false);
            setLoopNum((l) => l + 1);
            return prev;
          }
          return prev.slice(0, -1);
        } else {
          if (prev === fullText) {
            setIsDeleting(true);
            return prev;
          }
          return fullText.slice(0, prev.length + 1);
        }
      });
    }, speed);

    return () => clearTimeout(tick);
  }, [heroText, isDeleting, loopNum]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-red-500 selection:text-white overflow-x-hidden">

      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20"></div>
        <canvas id="signal-network" className="absolute inset-0 w-full h-full opacity-40" />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle items-center at ${mousePos.x}px ${mousePos.y}px, rgba(220, 38, 38, 0.15) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* --- NAV --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </div>
            <span className="text-xl font-bold tracking-tighter">VOLCANO</span>
          </div>


        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="relative z-10 pt-28 md:pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest mb-8">
          <Activity size={12} />
          <span>Feel the heat of innovation</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-8">
          MONETIZE<br />
          <span className="text-red-600 inline-block min-w-[20px]">
            {heroText}
          </span>
          <span className="inline-block w-3 h-3 md:w-5 md:h-5 bg-red-600 rounded-full ml-1 animate-pulse"></span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-light">
          The marketplace for outlier intelligence. <br className="hidden md:block" />
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/login/alien" className="group px-8 py-4 bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded hover:border-green-500 transition-all flex items-center justify-center gap-2">
            Login as Alien <ArrowRight size={16} className="group-hover:translate-x-1 group-hover:text-green-500 transition-all" />
          </Link>
          <Link to="/login/boardroom" className="group px-8 py-4 bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded hover:border-blue-500 transition-all flex items-center justify-center gap-2">
            Enter Boardroom <ArrowRight size={16} className="group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
          </Link>
        </div>
      </section>

      {/* --- THE PIPELINE (VALUE EXCHANGE) --- */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-2">The Value Pipeline</h2>
            <h3 className="text-3xl font-bold">From Insight to Income</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 bg-black border border-white/10 p-8 rounded-xl text-center group hover:border-red-500/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full border border-white/10 flex items-center justify-center mb-6 text-white group-hover:text-red-400 group-hover:scale-110 transition-all">
                <Lightbulb size={32} />
              </div>
              <h4 className="text-lg font-bold mb-2">1. Valid Signal</h4>
              <p className="text-sm text-gray-500">You submit a raw observation, idea, or solution anonymously.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-black border border-white/10 p-8 rounded-xl text-center group hover:border-red-500/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full border border-white/10 flex items-center justify-center mb-6 text-white group-hover:text-red-400 group-hover:scale-110 transition-all">
                <Shield size={32} />
              </div>
              <h4 className="text-lg font-bold mb-2">2. Volcano Vetting</h4>
              <p className="text-sm text-gray-500">Our Thinking Engine filters noise and verifies value potential.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-black border border-white/10 p-8 rounded-xl text-center group hover:border-red-500/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full border border-white/10 flex items-center justify-center mb-6 text-white group-hover:text-red-400 group-hover:scale-110 transition-all">
                <Building2 size={32} />
              </div>
              <h4 className="text-lg font-bold mb-2">3. Corporate Match</h4>
              <p className="text-sm text-gray-500">We route your insight to the specific Boardroom that needs it.</p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 bg-black border border-white/10 p-8 rounded-xl text-center group hover:border-red-500/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full border border-white/10 flex items-center justify-center mb-6 text-white group-hover:text-red-400 group-hover:scale-110 transition-all">
                <DollarSign size={32} />
              </div>
              <h4 className="text-lg font-bold mb-2">4. Instant Payout</h4>
              <p className="text-sm text-gray-500">The company pays for the solution. You get paid immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- DUAL PATHS (RETAINED COLORS) --- */}
      <section id="protocols" className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* Path: Alien */}
          <div className="border border-white/10 rounded-2xl p-10 bg-gradient-to-b from-white/5 to-transparent hover:border-green-500/30 transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <Users size={32} className="text-green-500" />
              <h3 className="text-2xl font-bold">For Aliens</h3>
            </div>
            <ul className="space-y-4 mb-8 text-gray-400">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Zero corporate politics. Just value.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Anonymous contribution.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-green-500" />
                <span>Market-rate compensation.</span>
              </li>
            </ul>
            <Link to="/login/alien" className="group inline-flex w-full items-center justify-center gap-2 py-4 text-center bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded hover:border-green-500 hover:text-green-500 transition-all">
              Join the Network <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Path: Boardroom */}
          <div className="border border-white/10 rounded-2xl p-10 bg-gradient-to-b from-white/5 to-transparent hover:border-blue-500/30 transition-all group">
            <div className="flex items-center gap-4 mb-8">
              <Building2 size={32} className="text-blue-500" />
              <h3 className="text-2xl font-bold">For Boardrooms</h3>
            </div>
            <ul className="space-y-4 mb-8 text-gray-400">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-blue-500" />
                <span>Access filtered, high-alpha Intel.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-blue-500" />
                <span>Vetted by Volcano Thinking Engine.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-blue-500" />
                <span>Pay only for actionable solutions.</span>
              </li>
            </ul>
            <Link to="/login/boardroom" className="group inline-flex w-full items-center justify-center gap-2 py-4 text-center bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded hover:border-blue-500 hover:text-blue-500 transition-all">
              Access Intelligence <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      {/* --- FOOTER --- */}
      <footer className="relative z-10 mt-auto border-t border-white/10 bg-neutral-900/80 backdrop-blur pt-16 pb-8 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span className="text-xl font-bold tracking-tighter text-white">VOLCANO</span>
            </div>
            <p className="text-gray-500 max-w-sm">
              The decentralized marketplace for high-value corporate intelligence.
              Connecting outlier minds with boardroom problems.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider">Protocols</h4>
            <ul className="space-y-2 text-gray-500">
              <li><Link to="/login/alien" className="hover:text-red-500 transition-colors">Alien Network</Link></li>
              <li><Link to="/login/boardroom" className="hover:text-red-500 transition-colors">Boardroom Access</Link></li>
              <li><a href="#how-it-works" className="hover:text-red-500 transition-colors">Logic Flow</a></li>
            </ul>
          </div>

          {/* Legal / Social */}
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-gray-500">
              <li><a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a></li>
              <li><Link to="/terms" className="hover:text-red-500 transition-colors">Terms of Service</Link></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Disclosures</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between px-6 max-w-7xl mx-auto text-gray-600">
          <p>&copy; 2026 VOLCANO PROTOCOL. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Code size={12} className="text-red-500" />
            <span className="text-red-500/50">SYSTEM_STATUS: OPTIMAL</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
