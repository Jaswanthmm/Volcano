// Authentication page for Aliens (Register/Login with 2-Step Dual OTP Verification).
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, Shield, AlertCircle, Eye, EyeOff, Phone, MessageSquare, CheckCircle2, RefreshCw, ArrowLeft, KeyRound } from 'lucide-react';
import { API_URL } from '../config';
import { setAuthSession, isAuthenticated } from '../utils/auth';

export const formatStandardPhone = (value) => {
    if (!value) return '+91 ';
    const raw = value.trim();
    if (raw === '+' || raw === '+91' || raw === '+91 ') return '+91 ';

    // If there is already a space after country code: e.g. "+91 1234567890" or "+1 5551234567"
    if (raw.startsWith('+') && raw.includes(' ')) {
        const parts = raw.split(/\s+/);
        const code = parts[0].replace(/\D/g, '');
        const national = parts.slice(1).join('').replace(/\D/g, '');
        if (!code) return `+91 ${national}`;
        if (!national) return `+${code} `;
        return `+${code} ${national}`;
    }

    const digits = raw.replace(/\D/g, '');
    if (!digits) return '+91 ';

    if (raw.startsWith('+')) {
        // e.g. +911234567890 or +15551234567
        if (digits.startsWith('91')) {
            const national = digits.slice(2);
            return national ? `+91 ${national}` : '+91 ';
        } else if (digits.startsWith('1') && digits.length > 1) {
            return `+1 ${digits.slice(1)}`;
        } else if (digits.startsWith('44') && digits.length > 2) {
            return `+44 ${digits.slice(2)}`;
        } else if (digits.length > 10) {
            const codeLen = digits.length - 10;
            return `+${digits.slice(0, codeLen)} ${digits.slice(codeLen)}`;
        } else {
            return `+91 ${digits}`;
        }
    } else {
        // No '+' prefix, e.g. 1234567890 or 911234567890
        if (digits.length === 12 && digits.startsWith('91')) {
            return `+91 ${digits.slice(2)}`;
        } else if (digits.length === 10) {
            return `+91 ${digits}`;
        } else if (digits.length > 10) {
            const codeLen = digits.length - 10;
            return `+${digits.slice(0, codeLen)} ${digits.slice(codeLen)}`;
        } else {
            return `+91 ${digits}`;
        }
    }
};

const AlienLogin = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [regStep, setRegStep] = useState(1); // 1 = Details, 2 = Dual OTP Verification
    const [formData, setFormData] = useState({ email: '', password: '', identifier: '', name: '', phone: '+91 ' });
    const [otpData, setOtpData] = useState({ email_otp: '', phone_otp: '' });
    const [devOtpInfo, setDevOtpInfo] = useState(null);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // If already authenticated with valid JWT, bounce directly to dashboard
        if (isAuthenticated('alien')) {
            const redirectPath = location.state?.from?.pathname || '/alien/dashboard';
            navigate(redirectPath, { replace: true });
            return;
        }

        const params = new URLSearchParams(location.search);
        if (location.state?.message) {
            setSuccessMsg(location.state.message);
        } else if (params.get('session_expired')) {
            setError('Neural uplink expired. Please sign in again.');
        } else if (params.get('timeout')) {
            setError('Session timed out due to inactivity. Please reconnect.');
        }
    }, [navigate, location]);

    // Resend countdown timer
    useEffect(() => {
        let timer;
        if (regStep === 2 && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [regStep, countdown]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleOtpChange = (e) => {
        setOtpData({ ...otpData, [e.target.name]: e.target.value });
        setError('');
    };

    // Request Dual OTPs for Registration
    const handleRequestOtp = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!formData.email || !formData.email.includes('@') || !formData.email.includes('.')) {
            setError('Please enter a valid Signal Frequency (email address).');
            return;
        }
        if (!formData.name) {
            setError('Alien Name is required to initialize node identification.');
            return;
        }
        const cleanPhone = formatStandardPhone(formData.phone);
        const phoneRegex = /^\+[0-9]{1,4}\s[0-9]{7,12}$/;
        if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
            setError('Valid Transmission Commlink in standard format (+91 1234567890) is required for SMS OTP.');
            return;
        }
        if (!formData.password || formData.password.length < 6) {
            setError('Access Key must be at least 6 characters in length.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/otp/send-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'alien',
                    email: formData.email.trim(),
                    phone: cleanPhone,
                    name: formData.name.trim()
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to dispatch verification codes.');
            }

            setRegStep(2);
            setCountdown(60);
            setCanResend(false);
            if (data.dev_mode && (data.dev_email_otp || data.dev_phone_otp)) {
                setDevOtpInfo({
                    email_otp: data.dev_email_otp || '',
                    phone_otp: data.dev_phone_otp || ''
                });
            }
            setSuccessMsg('Verification codes dispatched to your Email & SMS!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Final Submit: Login or Register (with OTP)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        if (isLogin) {
            // Login Flow
            try {
                const response = await fetch(`${API_URL}/api/auth/alien/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identifier: formData.identifier,
                        password: formData.password
                    }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Transmission failed.');
                }

                setAuthSession('alien', data);
                const redirectPath = location.state?.from?.pathname || '/alien/dashboard';
                navigate(redirectPath, { replace: true });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        } else {
            // Registration Step 2: Finalize with Dual OTPs
            if (!otpData.email_otp || otpData.email_otp.trim().length !== 6) {
                setError('Please enter the 6-digit Email verification code.');
                setLoading(false);
                return;
            }
            if (!otpData.phone_otp || otpData.phone_otp.trim().length !== 6) {
                setError('Please enter the 6-digit SMS commlink verification code.');
                setLoading(false);
                return;
            }

            const cleanPhone = formatStandardPhone(formData.phone);
            try {
                const response = await fetch(`${API_URL}/api/auth/alien/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email.trim(),
                        password: formData.password,
                        name: formData.name.trim(),
                        phone: cleanPhone,
                        email_otp: otpData.email_otp.trim(),
                        phone_otp: otpData.phone_otp.trim()
                    }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed.');
                }

                setSuccessMsg(`Uplink Established & Verified! Your Node Identifier is: ${data.alien_id}`);
                setIsLogin(true);
                setRegStep(1);
                setFormData({ email: '', password: '', identifier: data.alien_id, name: '', phone: '+91 ' });
                setOtpData({ email_otp: '', phone_otp: '' });
                setDevOtpInfo(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const autoFillDevOtp = () => {
        if (devOtpInfo) {
            setOtpData({
                email_otp: devOtpInfo.email_otp,
                phone_otp: devOtpInfo.phone_otp
            });
            setError('');
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden selection:bg-green-900 selection:text-white flex items-center justify-center alien-theme py-12 px-4">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.4)]"></div>
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)',
                        backgroundSize: '50px 50px'
                    }}>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-900/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-md p-2">

                {/* Header content */}
                <div className="mb-8 text-center relative group">
                    <div className="inline-block relative">
                        <div className="absolute -inset-1 rounded-lg bg-green-500/20 blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                        <Link to="/" className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4 border border-green-500/30 bg-black rounded-xl text-green-400 group-hover:text-green-300 group-hover:border-green-400/50 transition-all">
                            <User size={32} />
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-1 text-white">Alien Node</h1>
                    <p className="text-green-500/60 text-xs tracking-widest">SECURE UPLINK v3.2 &bull; QUANTUM PROTOCOL</p>

                    {/* Step Tracker Indicator (Registration Only) */}
                    {!isLogin && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-950/40 border border-green-500/30 rounded-full text-[10px] uppercase tracking-widest text-green-400">
                            <span className={`w-2 h-2 rounded-full ${regStep === 1 ? 'bg-green-400 animate-pulse' : 'bg-green-600'}`}></span>
                            Step {regStep} of 2: {regStep === 1 ? 'Node Coordinates' : 'Dual OTP Verification'}
                        </div>
                    )}
                </div>

                {/* Login/Register Card */}
                <div className="bg-black/60 backdrop-blur-md border border-green-500/25 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden">

                    {/* Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://media.giphy.com/media/dummy/giphy.gif')] mix-blend-overlay"></div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0" /> <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/40 rounded-lg text-green-300 text-xs flex items-center gap-2">
                            <Shield size={15} className="shrink-0" /> <span>{successMsg}</span>
                        </div>
                    )}

                    {/* ============================================================
                        VIEW 1: LOGIN FORM
                    ============================================================ */}
                    {isLogin && (
                        <form className="relative z-10 space-y-6" onSubmit={handleSubmit} autoComplete="off">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">Node Identifier (Alien ID or Email)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="identifier"
                                        required
                                        value={formData.identifier}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm"
                                        placeholder="ALIEN-XXXX or entity@void.net"
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors">
                                        <User size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">Access Key (Password)</label>
                                    <Link to="/forgot-password/alien" className="text-[10px] text-green-500/50 hover:text-green-400 transition-colors">
                                        Forgot ?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <div
                                        className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors cursor-pointer hover:text-green-400"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-green-950/40 hover:bg-green-500 text-green-400 hover:text-black border border-green-500/40 rounded-lg px-4 py-4 mt-6 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                            >
                                {loading ? 'Transmitting Neural Uplink...' : 'Establish Link'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* ============================================================
                        VIEW 2: REGISTRATION - STEP 1 (COORDINATES)
                    ============================================================ */}
                    {!isLogin && regStep === 1 && (
                        <form className="relative z-10 space-y-5" onSubmit={handleRequestOtp} autoComplete="off">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">Signal Frequency (Email)</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm"
                                        placeholder="rahul.s@gmail.com"
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors">
                                        <Shield size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">Alien Alias / Name</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm"
                                        placeholder="Rahul"
                                        autoComplete="name"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors">
                                        <User size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">Commlink (Mobile)</label>

                                </div>
                                <div className="relative group">
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onBlur={(e) => {
                                            const formatted = formatStandardPhone(e.target.value);
                                            if (formatted) {
                                                setFormData(prev => ({ ...prev, phone: formatted }));
                                            }
                                        }}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm font-mono"
                                        placeholder="+91 1234567890"
                                        autoComplete="tel"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">Access Key (Password)</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                    />
                                    <div
                                        className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors cursor-pointer hover:text-green-400"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>

                            {/* Terms Checkbox */}
                            <div className="flex items-center gap-2 pt-1 ml-1">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    required
                                    onInvalid={e => e.target.setCustomValidity('Please accept protocol conditions to proceed!')}
                                    onInput={e => e.target.setCustomValidity('')}
                                    className="w-3.5 h-3.5 bg-black/60 border border-green-500/40 rounded focus:ring-1 focus:ring-green-500 text-green-500 cursor-pointer"
                                />
                                <label htmlFor="terms" className="text-[10px] text-green-500/70 tracking-wide cursor-pointer select-none">
                                    I agree to the <Link to="/terms" target="_blank" className="text-green-400 underline hover:text-green-300">Protocol Terms & Conditions</Link>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-green-950/40 hover:bg-green-500 text-green-400 hover:text-black border border-green-500/40 rounded-lg px-4 py-4 mt-6 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                            >
                                {loading ? 'Scanning Neural Network...' : 'Proceed to Dual OTP Verification'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* ============================================================
                        VIEW 3: REGISTRATION - STEP 2 (DUAL OTP VERIFICATION)
                    ============================================================ */}
                    {!isLogin && regStep === 2 && (
                        <form className="relative z-10 space-y-6" onSubmit={handleSubmit} autoComplete="off">
                            {/* Target Overview Box */}
                            <div className="p-3.5 bg-green-950/20 border border-green-500/20 rounded-xl space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-green-500/60 border-b border-green-500/10 pb-1.5">
                                    <span>Target Commlink Route</span>
                                    <span className="text-green-400 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Dispatched
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-green-500/70 text-[11px]">Email Frequency:</span>
                                    <span className="text-white font-mono text-[11px] truncate max-w-[210px]">{formData.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-green-500/70 text-[11px]">Mobile Commlink (SMS):</span>
                                    <span className="text-white font-mono text-[11px]">{formData.phone}</span>
                                </div>
                            </div>

                            {/* Dev Mode Simulator Box (Visible if backend returns debug OTPs in dev mode) */}
                            {devOtpInfo && (
                                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-300 text-[11px] space-y-2">
                                    <div className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider text-emerald-400">
                                        <span>⚡ Local Dev Simulator Active</span>
                                        <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[9px]">DEBUG</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                        <div>Email: <span className="text-white font-bold">{devOtpInfo.email_otp}</span></div>
                                        <div>SMS: <span className="text-white font-bold">{devOtpInfo.phone_otp}</span></div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={autoFillDevOtp}
                                        className="w-full py-1 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Auto-Fill Dev Verification Codes
                                    </button>
                                </div>
                            )}

                            {/* Email OTP Field */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold flex items-center justify-between">
                                    <span>Signal Frequency OTP (Email)</span>
                                    <span className="text-green-400 text-[9px]">6-DIGIT CODE</span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="email_otp"
                                        maxLength="6"
                                        required
                                        value={otpData.email_otp}
                                        onChange={handleOtpChange}
                                        className="w-full bg-black/60 border border-green-500/40 rounded-lg px-4 py-3 text-green-300 font-mono tracking-[0.4em] text-center focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-base"
                                        placeholder="••••••"
                                        autoComplete="one-time-code"
                                    />
                                    <div className="absolute left-3 top-3.5 text-green-500/30">
                                        <Shield size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Phone / SMS OTP Field */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold flex items-center justify-between">
                                    <span>Commlink OTP (SMS)</span>
                                    <span className="text-green-400 text-[9px]">6-DIGIT CODE</span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="phone_otp"
                                        maxLength="6"
                                        required
                                        value={otpData.phone_otp}
                                        onChange={handleOtpChange}
                                        className="w-full bg-black/60 border border-green-500/40 rounded-lg px-4 py-3 text-green-300 font-mono tracking-[0.4em] text-center focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-base"
                                        placeholder="••••••"
                                        autoComplete="one-time-code"
                                    />
                                    <div className="absolute left-3 top-3.5 text-green-500/30">
                                        <MessageSquare size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Resend Action */}
                            <div className="flex items-center justify-between text-[11px] pt-1">
                                <button
                                    type="button"
                                    onClick={() => setRegStep(1)}
                                    className="text-green-500/60 hover:text-green-400 flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft size={13} /> Edit Coordinates
                                </button>
                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={loading}
                                        className="text-green-400 hover:text-green-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Resend Codes
                                    </button>
                                ) : (
                                    <span className="text-green-500/40 text-[10px]">
                                        Resend in <span className="text-green-400 font-mono font-bold">{countdown}s</span>
                                    </span>
                                )}
                            </div>

                            {/* Verify & Complete Registration Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-green-500 hover:bg-green-400 text-black border border-green-400 rounded-lg px-4 py-4 mt-4 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                            >
                                {loading ? 'Validating Dual Cryptographic Keys...' : 'Verify Codes & Register Alien Node'}
                                <Shield size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* Toggle View (Login vs Register) */}
                    <div className="mt-8 text-center pt-4 border-t border-green-500/10">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setRegStep(1);
                                setError('');
                                setSuccessMsg('');
                                if (isLogin) {
                                    setFormData(prev => ({ ...prev, phone: prev.phone || '+91 ' }));
                                }
                            }}
                            className="text-[10px] uppercase tracking-widest text-green-500/50 hover:text-green-400 transition-colors"
                        >
                            {isLogin ? "New Alien in town? Initialize Uplink Protocol" : "Existing Alien? Reconnect Link"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-[10px] text-green-900/101 uppercase tracking-widest">
                    Encrypted via Neural Exchange v3.2
                </div>

            </div>
        </div>
    );
};

export default AlienLogin;