// Password recovery page for Aliens (Cyberpunk terminal theme with 2-step OTP reset).
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Shield, AlertCircle, Eye, EyeOff, CheckCircle2, RefreshCw, ArrowLeft, KeyRound, Terminal } from 'lucide-react';
import { API_URL } from '../config';

const AlienForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = Request Code, 2 = Verify & Set Password, 3 = Success
    const [identifier, setIdentifier] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [maskedEmail, setMaskedEmail] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [devOtp, setDevOtp] = useState('');

    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Resend countdown timer
    useEffect(() => {
        let timer;
        if (step === 2 && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step, countdown]);

    // Step 1: Request Password Reset Code
    const handleRequestCode = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!identifier.trim()) {
            setError('Please enter your Alien ID (e.g. ALIEN-XXXX) or registered Signal Email.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'alien',
                    identifier: identifier.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to dispatch recovery code.');
            }

            setMaskedEmail(data.target_email || '');
            setMaskedPhone(data.target_phone || '');
            if (data.dev_mode && data.dev_otp) {
                setDevOtp(data.dev_otp);
            }

            setStep(2);
            setCountdown(60);
            setCanResend(false);
            setSuccessMsg('Recovery authorization code dispatched to your commlink.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Code & Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!otpCode || otpCode.trim().length !== 6) {
            setError('Please enter the 6-digit recovery code.');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            setError('Access Key must be at least 6 characters in length.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Access Keys do not match. Please verify both inputs.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'alien',
                    identifier: identifier.trim(),
                    otp_code: otpCode.trim(),
                    new_password: newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Password override rejected.');
            }

            setStep(3);
            setSuccessMsg(data.message || 'Access Key overridden successfully!');
            // Auto redirect to login after 3.5 seconds
            setTimeout(() => {
                navigate('/login/alien', {
                    state: { message: 'Access Key updated successfully! Please sign in with your new credentials.' }
                });
            }, 3500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const autoFillDevOtp = () => {
        if (devOtp) {
            setOtpCode(devOtp);
            setError('');
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center p-4 relative overflow-hidden selection:bg-green-500 selection:text-black">

            {/* Matrix Grid Lines Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)',
                        backgroundSize: '50px 50px'
                    }}>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-900/10 blur-[100px] rounded-full"></div>
            </div>

            {/* Main Form Container */}
            <div className="relative z-10 w-full max-w-md p-2">

                {/* Header */}
                <div className="mb-8 text-center relative group">
                    <div className="inline-block relative">
                        <div className="absolute -inset-1 rounded-lg bg-green-500/20 blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                        <Link to="/login/alien" className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4 border border-green-500/30 bg-black rounded-xl text-green-400 group-hover:text-green-300 group-hover:border-green-400/50 transition-all">
                            <KeyRound size={32} />
                        </Link>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] mb-1 text-white">Override Access Key</h1>
                    <p className="text-green-500/60 text-xs tracking-widest">NEURAL RECOVERY PROTOCOL &bull; DUAL FACTOR VERIFICATION</p>

                    {/* Step Tracker */}
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-950/40 border border-green-500/30 rounded-full text-[10px] uppercase tracking-widest text-green-400">
                        <span className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-green-400 animate-pulse' : 'bg-green-600'}`}></span>
                        Step {step} of 2: {step === 1 ? 'Node Coordinates' : step === 2 ? 'Security Override' : 'Key Activated'}
                    </div>
                </div>

                {/* Card Container */}
                <div className="bg-black/60 backdrop-blur-md border border-green-500/25 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden">

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0" /> <span>{error}</span>
                        </div>
                    )}

                    {successMsg && step !== 3 && (
                        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/40 rounded-lg text-green-300 text-xs flex items-center gap-2">
                            <Shield size={15} className="shrink-0" /> <span>{successMsg}</span>
                        </div>
                    )}

                    {/* ============================================================
                        STEP 1: REQUEST RECOVERY CODE
                    ============================================================ */}
                    {step === 1 && (
                        <form className="relative z-10 space-y-5" onSubmit={handleRequestCode} autoComplete="off">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">
                                    Alien Identifier (Alien ID or Signal Email)
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm font-mono"
                                        placeholder="ALIEN-XXXX or entity@void.net"
                                        autoComplete="username"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors">
                                        <User size={18} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-green-500/50">
                                    We will dispatch a cryptographic authorization key to your registered Signal Email and Commlink.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-green-500 hover:bg-green-400 text-black border border-green-400 rounded-lg px-4 py-4 mt-6 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                            >
                                {loading ? 'Scanning Neural Grid...' : 'Transmit Recovery Signal'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="pt-4 text-center border-t border-green-500/10">
                                <Link
                                    to="/login/alien"
                                    className="text-[10px] uppercase tracking-widest text-green-500/50 hover:text-green-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={13} /> Return to Terminal Login
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* ============================================================
                        STEP 2: VERIFY RECOVERY CODE & SET NEW PASSWORD
                    ============================================================ */}
                    {step === 2 && (
                        <form className="relative z-10 space-y-5" onSubmit={handleResetPassword} autoComplete="off">
                            {/* Target destination badge */}
                            <div className="p-3 bg-green-950/30 border border-green-500/20 rounded-xl space-y-1">
                                <div className="text-[10px] text-green-500/60 uppercase tracking-widest">Recovery Target</div>
                                {maskedEmail && (
                                    <div className="text-xs text-white font-mono flex items-center gap-2">
                                        <span className="text-green-400 text-[10px] uppercase font-bold">Email:</span> {maskedEmail}
                                    </div>
                                )}
                                {maskedPhone && (
                                    <div className="text-xs text-white font-mono flex items-center gap-2">
                                        <span className="text-green-400 text-[10px] uppercase font-bold">SMS:</span> {maskedPhone}
                                    </div>
                                )}
                            </div>

                            {/* Dev Mode Banner */}
                            {devOtp && (
                                <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between text-xs">
                                    <span className="text-green-300">
                                        Dev Code: <strong className="font-mono text-white text-sm">{devOtp}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={autoFillDevOtp}
                                        className="text-[10px] px-2 py-1 bg-green-500 text-black font-bold rounded uppercase tracking-wider hover:bg-green-400 transition-colors"
                                    >
                                        Auto-Fill
                                    </button>
                                </div>
                            )}

                            {/* 6-Digit Code Input */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">
                                    6-Digit Recovery Key
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-center tracking-[0.5em] font-mono text-lg font-bold"
                                        placeholder="••••••"
                                    />
                                    <div className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors">
                                        <Terminal size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">
                                    New Access Key (Password)
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm font-mono"
                                        placeholder="Min. 6 characters"
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

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-green-500/60 font-bold block">
                                    Confirm New Access Key
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                        className="w-full bg-black/60 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 focus:outline-none focus:border-green-400 transition-colors placeholder-green-500/60 text-sm font-mono"
                                        placeholder="Repeat new key"
                                        autoComplete="new-password"
                                    />
                                    <div
                                        className="absolute right-3 top-3 text-green-500/30 group-focus-within:text-green-500/70 transition-colors cursor-pointer hover:text-green-400"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>

                            {/* Resend Action */}
                            <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-green-500/60 hover:text-green-300 flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft size={13} /> Change Node
                                </button>
                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleRequestCode}
                                        disabled={loading}
                                        className="text-green-400 hover:text-green-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Resend Code
                                    </button>
                                ) : (
                                    <span className="text-green-500/40 text-[10px]">
                                        Resend in <span className="text-green-400 font-mono font-bold">{countdown}s</span>
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-green-500 hover:bg-green-400 text-black border border-green-400 rounded-lg px-4 py-4 mt-4 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                            >
                                {loading ? 'Re-encrypting Node...' : 'Override & Activate New Key'}
                                <Shield size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* ============================================================
                        STEP 3: SUCCESS STATE
                    ============================================================ */}
                    {step === 3 && (
                        <div className="text-center py-6 space-y-5">
                            <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto text-green-400 animate-pulse">
                                <CheckCircle2 size={36} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Access Key Overridden</h3>
                                <p className="text-xs text-green-400/80 leading-relaxed font-mono">
                                    Cryptographic clearance verified. Your new access key is active across the neural grid.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link
                                    to="/login/alien"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                                >
                                    Proceed to Terminal Login <ArrowRight size={14} />
                                </Link>
                            </div>
                            <p className="text-[10px] text-green-500/40">
                                Redirecting automatically in 3 seconds...
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-[10px] text-green-900/60 uppercase tracking-widest">
                    Encrypted via Neural Exchange v3.2 &bull; Quantum Safeguards Active
                </div>

            </div>
        </div>
    );
};

export default AlienForgotPassword;
