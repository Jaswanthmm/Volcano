// Authentication page for Boardroom Titans (Register/Login with 2-Step Dual OTP Verification).
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Lock, ArrowRight, Shield, Building, AlertCircle, Eye, EyeOff, Phone, MessageSquare, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';
import { setAuthSession, isAuthenticated } from '../utils/auth';

export const normalizeDomain = (url) => {
    if (!url) return '';
    let clean = url.trim().toLowerCase();
    // remove scheme (http://, https://, etc.)
    clean = clean.replace(/^[a-zA-Z]+:\/\//i, '');
    // remove www. prefix
    if (clean.startsWith('www.')) {
        clean = clean.slice(4);
    }
    // remove path, query, hash, and port
    clean = clean.split('/')[0].split('?')[0].split('#')[0].split(':')[0].trim();
    return clean;
};

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

const BoardroomLogin = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [regStep, setRegStep] = useState(1); // 1 = Details, 2 = Dual OTP Verification
    const [formData, setFormData] = useState({ company_name: '', email: '', password: '', website_url: '', phone: '+91 ' });
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
        if (isAuthenticated('titan')) {
            const redirectPath = location.state?.from?.pathname || '/boardroom/dashboard';
            navigate(redirectPath, { replace: true });
            return;
        }

        const params = new URLSearchParams(location.search);
        if (location.state?.message) {
            setSuccessMsg(location.state.message);
        } else if (params.get('session_expired')) {
            setError('Executive session expired. Please authenticate again.');
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

    // Step 1: Request Dual Verification Codes
    const handleRequestOtp = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!formData.company_name.trim()) {
            setError('Company Name is required.');
            return;
        }
        const cleanDomain = normalizeDomain(formData.website_url);
        if (!cleanDomain || !cleanDomain.includes('.') || cleanDomain.endsWith('.')) {
            setError('Please enter a valid company website domain (e.g., flipkart.com).');
            return;
        }
        const cleanPhone = formatStandardPhone(formData.phone);
        const phoneRegex = /^\+[0-9]{1,4}\s[0-9]{7,12}$/;
        if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
            setError('Please enter a valid representative mobile number in standard format: +91 1234567890');
            return;
        }

        const emailDomain = formData.email.split('@')[1]?.toLowerCase();
        const blockedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com'];
        if (blockedDomains.includes(emailDomain)) {
            setError('Corporate domain required. Public email providers (Gmail, Yahoo, Outlook, etc.) are not authorized for Boardroom access.');
            return;
        }
        if (!formData.password || formData.password.length < 6) {
            setError('Password must be at least 6 characters in length.');
            return;
        }

        // Sync normalized domain & phone in state
        if (cleanDomain !== formData.website_url || cleanPhone !== formData.phone) {
            setFormData(prev => ({ ...prev, website_url: cleanDomain, phone: cleanPhone }));
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/otp/send-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'boardroom',
                    company_name: formData.company_name.trim(),
                    website_url: cleanDomain,
                    email: formData.email.trim(),
                    phone: cleanPhone
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to dispatch executive verification codes.');
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
            setSuccessMsg('Executive verification codes dispatched to Corporate Email & SMS!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Final Submit: Login or Register (Step 2)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        if (isLogin) {
            // Login Flow
            try {
                const response = await fetch(`${API_URL}/api/auth/boardroom/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Mainframe connection rejected.');
                }

                setAuthSession('titan', data);
                const redirectPath = location.state?.from?.pathname || '/boardroom/dashboard';
                navigate(redirectPath, { replace: true });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        } else {
            // Registration Step 2: Dual OTP Submission
            if (!otpData.email_otp || otpData.email_otp.trim().length !== 6) {
                setError('Please enter the 6-digit Corporate Email verification code.');
                setLoading(false);
                return;
            }
            if (!otpData.phone_otp || otpData.phone_otp.trim().length !== 6) {
                setError('Please enter the 6-digit SMS verification code.');
                setLoading(false);
                return;
            }

            const cleanDomain = normalizeDomain(formData.website_url);
            const cleanPhone = formatStandardPhone(formData.phone);
            try {
                const response = await fetch(`${API_URL}/api/auth/boardroom/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_name: formData.company_name.trim(),
                        email: formData.email.trim(),
                        password: formData.password,
                        website_url: cleanDomain,
                        phone: cleanPhone,
                        email_otp: otpData.email_otp.trim(),
                        phone_otp: otpData.phone_otp.trim()
                    }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Organization registration failed.');
                }

                setSuccessMsg(`Executive Credentials Verified! Welcome to the Boardroom, ${data.company_name}. Please sign in to access your intelligence dashboard.`);
                setIsLogin(true);
                setRegStep(1);
                setFormData({ company_name: '', email: formData.email, password: '', website_url: '', phone: '+91 ' });
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
        <div className="min-h-screen bg-black text-white font-space relative overflow-hidden flex items-center justify-center selection:bg-blue-500 selection:text-white titan-theme py-12 px-4">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full opacity-60"></div>
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-indigo-900/10 blur-[100px] rounded-full opacity-40"></div>

                {/* Subtle Grid */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
                        backgroundSize: '80px 80px',
                        maskImage: 'linear-gradient(to bottom, black, transparent 90%)'
                    }}>
                </div>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-md p-2">

                {/* Header content */}
                <div className="mb-8 text-center">
                    <Link to="/" className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white/5 border border-white/10 rounded-2xl text-blue-400 shadow-2xl backdrop-blur-xl hover:scale-105 transition-transform duration-300">
                        <Building2 size={32} />
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1 text-white">Boardroom Access</h1>
                    <p className="text-blue-200/50 text-xs uppercase tracking-[0.3em] font-bold">Industrial Intelligence Portal</p>

                    {/* Step Tracker Indicator (Registration Only) */}
                    {!isLogin && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-950/40 border border-blue-500/30 rounded-full text-[10px] uppercase tracking-widest text-blue-300">
                            <span className={`w-2 h-2 rounded-full ${regStep === 1 ? 'bg-blue-400 animate-pulse' : 'bg-blue-600'}`}></span>
                            Step {regStep} of 2: {regStep === 1 ? 'Organization Profile' : 'Executive Dual OTP'}
                        </div>
                    )}
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_60px_rgba(30,58,138,0.25)] relative overflow-hidden">

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0" /> <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-6 p-3 bg-blue-900/30 border border-blue-500/30 rounded-xl text-blue-200 text-xs flex items-center gap-2">
                            <Shield size={15} className="shrink-0" /> <span>{successMsg}</span>
                        </div>
                    )}

                    {/* ============================================================
                        VIEW 1: LOGIN FORM
                    ============================================================ */}
                    {isLogin && (
                        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">Corporate Email</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="executive@company.com"
                                        autoComplete="email"
                                    />
                                    <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                        <Shield size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold">Secure Credentials</label>
                                    <Link to="/forgot-password/boardroom" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
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
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="••••••••••••"
                                        autoComplete="current-password"
                                    />
                                    <div
                                        className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors cursor-pointer hover:text-white"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-white text-black hover:bg-blue-50 border border-transparent rounded-xl px-4 py-4 mt-8 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-blue-900/20 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Authenticating Enterprise Key...' : 'Enter Boardroom'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* ============================================================
                        VIEW 2: REGISTRATION - STEP 1 (PROFILE DETAILS)
                    ============================================================ */}
                    {!isLogin && regStep === 1 && (
                        <form className="space-y-5" onSubmit={handleRequestOtp} autoComplete="off">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">Company Name</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="company_name"
                                        required
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="Volcano Industries Inc."
                                        autoComplete="organization"
                                    />
                                    <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                        <Building size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold">Company Website</label>
                                    <span className="text-[9px] text-blue-400 font-mono"></span>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="website_url"
                                        required
                                        value={formData.website_url}
                                        onChange={handleChange}
                                        onBlur={(e) => {
                                            const normalized = normalizeDomain(e.target.value);
                                            if (normalized) {
                                                setFormData(prev => ({ ...prev, website_url: normalized }));
                                            }
                                        }}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm font-mono"
                                        placeholder="flipkart.com"
                                        autoComplete="url"
                                    />
                                    <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                                        <span className="text-[10px] font-bold text-blue-400">DOMAIN</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold">Representative Mobile</label>

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
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm font-mono"
                                        placeholder="+91 1234567890"
                                        autoComplete="tel"
                                    />
                                    <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">Corporate Email </label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="executive@company.com"
                                        autoComplete="email"
                                    />
                                    <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                        <Shield size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">Secure Credentials</label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="••••••••••••"
                                        autoComplete="new-password"
                                    />
                                    <div
                                        className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors cursor-pointer hover:text-white"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>

                            {/* Disclaimers & Representation */}
                            <div className="space-y-2.5 pt-2 ml-1">
                                <div className="flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        id="corporate-representation"
                                        required
                                        onInvalid={e => e.target.setCustomValidity('Please accept authorized representation to proceed!')}
                                        onInput={e => e.target.setCustomValidity('')}
                                        className="w-3.5 h-3.5 mt-0.5 bg-black/30 border border-blue-200/30 rounded focus:ring-1 focus:ring-blue-500 text-blue-500 cursor-pointer shrink-0"
                                    />
                                    <label htmlFor="corporate-representation" className="text-[10px] text-blue-200/70 tracking-wide cursor-pointer select-none leading-relaxed">
                                        I confirm that I am an <span className="text-blue-300 font-semibold">authorized representative</span> of this company. I acknowledge that registering with our corporate domain claims sole organization access and prevents any other individuals from creating an account on behalf of this company.
                                    </label>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        required
                                        onInvalid={e => e.target.setCustomValidity('Please accept protocol conditions to proceed!')}
                                        onInput={e => e.target.setCustomValidity('')}
                                        className="w-3.5 h-3.5 bg-black/30 border border-blue-200/30 rounded focus:ring-1 focus:ring-blue-500 text-blue-500 cursor-pointer shrink-0"
                                    />
                                    <label htmlFor="terms" className="text-[10px] text-blue-200/60 uppercase tracking-wide cursor-pointer select-none">
                                        I accept the <Link to="/terms" target="_blank" className="text-blue-400 hover:text-white transition-colors">Protocol Terms & Conditions</Link>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-white text-black hover:bg-blue-50 border border-transparent rounded-xl px-4 py-4 mt-6 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-blue-900/20 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Validating Organization Records...' : 'Proceed to Executive Verification'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* ============================================================
                        VIEW 3: REGISTRATION - STEP 2 (DUAL OTP VERIFICATION)
                    ============================================================ */}
                    {!isLogin && regStep === 2 && (
                        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
                            {/* Target Overview Card */}
                            <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-2xl space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-blue-300/60 border-b border-blue-500/10 pb-1.5">
                                    <span>Executive Identity Channels</span>
                                    <span className="text-blue-400 flex items-center gap-1 font-semibold">
                                        <CheckCircle2 size={13} /> Active Handshake
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200/60 text-[11px]">Corporate Inbox:</span>
                                    <span className="text-white font-medium text-[11px] truncate max-w-[210px]">{formData.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200/60 text-[11px]">Representative Mobile (SMS):</span>
                                    <span className="text-white font-medium text-[11px]">{formData.phone}</span>
                                </div>
                            </div>

                            {/* Dev Mode Simulator Box (Visible if backend returns debug OTPs in dev mode) */}
                            {devOtpInfo && (
                                <div className="p-3 bg-blue-950/40 border border-blue-400/30 rounded-xl text-blue-200 text-[11px] space-y-2">
                                    <div className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider text-blue-300">
                                        <span>⚡ Local Dev Simulator Active</span>
                                        <span className="bg-blue-500/20 px-1.5 py-0.5 rounded text-[9px] text-blue-300">DEBUG</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                        <div>Email: <span className="text-white font-bold">{devOtpInfo.email_otp}</span></div>
                                        <div>SMS: <span className="text-white font-bold">{devOtpInfo.phone_otp}</span></div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={autoFillDevOtp}
                                        className="w-full py-1.5 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Auto-Fill Dev Verification Codes
                                    </button>
                                </div>
                            )}

                            {/* Corporate Email OTP */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold flex items-center justify-between ml-1">
                                    <span>Corporate Email OTP</span>
                                    <span className="text-blue-400 text-[9px]">6-DIGIT CODE</span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="email_otp"
                                        maxLength="6"
                                        required
                                        value={otpData.email_otp}
                                        onChange={handleOtpChange}
                                        className="w-full bg-black/30 border border-blue-500/30 rounded-xl px-4 py-3.5 text-white font-mono tracking-[0.4em] text-center focus:outline-none focus:border-blue-400 transition-colors placeholder-white/50 text-base"
                                        placeholder="••••••"
                                        autoComplete="one-time-code"
                                    />
                                    <div className="absolute left-3.5 top-4 text-white/30">
                                        <Shield size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* SMS OTP */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold flex items-center justify-between ml-1">
                                    <span>Representative SMS OTP</span>
                                    <span className="text-blue-400 text-[9px]">6-DIGIT CODE</span>
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        name="phone_otp"
                                        maxLength="6"
                                        required
                                        value={otpData.phone_otp}
                                        onChange={handleOtpChange}
                                        className="w-full bg-black/30 border border-blue-500/30 rounded-xl px-4 py-3.5 text-white font-mono tracking-[0.4em] text-center focus:outline-none focus:border-blue-400 transition-colors placeholder-white/50 text-base"
                                        placeholder="••••••"
                                        autoComplete="one-time-code"
                                    />
                                    <div className="absolute left-3.5 top-4 text-white/30">
                                        <MessageSquare size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Resend Action */}
                            <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                                <button
                                    type="button"
                                    onClick={() => setRegStep(1)}
                                    className="text-blue-200/60 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft size={13} /> Edit Profile
                                </button>
                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={loading}
                                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Resend Codes
                                    </button>
                                ) : (
                                    <span className="text-blue-200/40 text-[10px]">
                                        Resend in <span className="text-blue-300 font-mono font-bold">{countdown}s</span>
                                    </span>
                                )}
                            </div>

                            {/* Submit & Register Organization */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-blue-500 hover:bg-blue-400 text-white font-bold border border-transparent rounded-xl px-4 py-4 mt-4 transition-all duration-300 flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Validating Multi-Factor Security...' : 'Authorize Organization & Join Boardroom'}
                                <Shield size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* Toggle View */}
                    <div className="mt-8 text-center pt-6 border-t border-white/5">
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
                            className="text-[11px] text-blue-200/40 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            {isLogin ? (
                                <>New Organization? <span className="text-blue-400">Apply for Partnership</span></>
                            ) : (
                                <>Already a Partner? <span className="text-blue-400">Access Boardroom</span></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 text-center">
                    <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-2">Protected by</div>
                    <div className="flex items-center justify-center gap-2 opacity-30">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-bold tracking-widest text-[10px]">VOLCANO SECURITY</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BoardroomLogin;