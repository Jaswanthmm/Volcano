// Password recovery page for Boardroom Executives (Executive glassmorphism theme with 2-step OTP reset).
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Shield, AlertCircle, Eye, EyeOff, CheckCircle2, RefreshCw, ArrowLeft, ArrowRight, KeyRound, Building } from 'lucide-react';
import { API_URL } from '../config';

const BoardroomForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = Request Code, 2 = Verify & Reset, 3 = Success
    const [email, setEmail] = useState('');
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

    // Step 1: Request Clearance Code
    const handleRequestCode = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!email.trim() || !email.includes('@') || !email.includes('.')) {
            setError('Please enter your authorized Corporate Email address.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'boardroom',
                    identifier: email.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to dispatch security clearance code.');
            }

            setMaskedEmail(data.target_email || '');
            setMaskedPhone(data.target_phone || '');
            if (data.dev_mode && data.dev_otp) {
                setDevOtp(data.dev_otp);
            }

            setStep(2);
            setCountdown(60);
            setCanResend(false);
            setSuccessMsg('Security clearance verification code dispatched to your corporate coordinates.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Code & Reset Corporate Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!otpCode || otpCode.trim().length !== 6) {
            setError('Please enter the 6-digit corporate verification code.');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            setError('Corporate Access Key must be at least 6 characters in length.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Credentials do not match. Please verify both inputs.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'boardroom',
                    identifier: email.trim(),
                    otp_code: otpCode.trim(),
                    new_password: newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Corporate credential reset failed.');
            }

            setStep(3);
            setSuccessMsg(data.message || 'Corporate credentials updated successfully!');
            // Auto redirect to boardroom login after 3.5 seconds
            setTimeout(() => {
                navigate('/login/boardroom', {
                    state: { message: 'Corporate credentials updated successfully! Please log in.' }
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
        <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">

            {/* Ambient Corporate Glow Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[140px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[140px] rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>
            </div>

            {/* Container */}
            <div className="relative z-10 w-full max-w-md">

                {/* Header Section */}
                <div className="mb-8 text-center relative group">
                    <div className="inline-block relative">
                        <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition duration-700"></div>
                        <Link to="/login/boardroom" className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4 border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl text-blue-400 group-hover:text-blue-300 group-hover:scale-105 transition-all shadow-xl">
                            <Building2 size={32} />
                        </Link>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight uppercase mb-1">Reset Boardroom Access</h1>
                    <p className="text-blue-200/50 text-xs tracking-widest uppercase">ENTERPRISE CLEARANCE &bull; DUAL FACTOR RECOVERY</p>

                    {/* Step Tracker */}
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-500/20 rounded-full text-[10px] uppercase tracking-widest text-blue-300">
                        <span className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-400 animate-pulse' : 'bg-blue-600'}`}></span>
                        Step {step} of 2: {step === 1 ? 'Corporate Identity' : step === 2 ? 'Security Clearance' : 'Authorized'}
                    </div>
                </div>

                {/* Glassmorphic Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_0_60px_rgba(30,58,138,0.25)] relative overflow-hidden">

                    {/* Alerts */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-200 text-xs flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0" /> <span>{error}</span>
                        </div>
                    )}

                    {successMsg && step !== 3 && (
                        <div className="mb-6 p-3 bg-blue-900/30 border border-blue-500/30 rounded-xl text-blue-200 text-xs flex items-center gap-2">
                            <Shield size={15} className="shrink-0" /> <span>{successMsg}</span>
                        </div>
                    )}

                    {/* ============================================================
                        STEP 1: REQUEST CLEARANCE CODE
                    ============================================================ */}
                    {step === 1 && (
                        <form className="space-y-5" onSubmit={handleRequestCode} autoComplete="off">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">
                                    Corporate Email Address
                                </label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="executive@company.com"
                                        autoComplete="email"
                                    />
                                    <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                        <Shield size={18} />
                                    </div>
                                </div>
                                <p className="text-[11px] text-blue-200/40 ml-1">
                                    Enter the official corporate email linked to your Boardroom partnership.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-white text-black hover:bg-blue-50 border border-transparent rounded-xl px-4 py-4 mt-6 transition-all duration-300 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-blue-900/20 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Validating Enterprise Registry...' : 'Dispatch Clearance Code'}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="pt-4 text-center border-t border-white/5">
                                <Link
                                    to="/login/boardroom"
                                    className="text-[11px] text-blue-200/40 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={13} /> Return to Boardroom Access
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* ============================================================
                        STEP 2: VERIFY CODE & SET NEW PASSWORD
                    ============================================================ */}
                    {step === 2 && (
                        <form className="space-y-5" onSubmit={handleResetPassword} autoComplete="off">
                            {/* Masked destination info */}
                            <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl space-y-1">
                                <div className="text-[10px] text-blue-300/60 uppercase tracking-widest font-bold">Clearance Destination</div>
                                {maskedEmail && (
                                    <div className="text-xs text-white font-mono flex items-center gap-2">
                                        <span className="text-blue-400 text-[10px] uppercase font-bold">Corporate Email:</span> {maskedEmail}
                                    </div>
                                )}
                                {maskedPhone && (
                                    <div className="text-xs text-white font-mono flex items-center gap-2">
                                        <span className="text-blue-400 text-[10px] uppercase font-bold">Representative Mobile:</span> {maskedPhone}
                                    </div>
                                )}
                            </div>

                            {/* Dev Mode Banner */}
                            {devOtp && (
                                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs">
                                    <span className="text-blue-200">
                                        Dev Code: <strong className="font-mono text-white text-sm">{devOtp}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={autoFillDevOtp}
                                        className="text-[10px] px-2.5 py-1 bg-blue-500 text-white font-bold rounded-lg uppercase tracking-wider hover:bg-blue-400 transition-colors"
                                    >
                                        Auto-Fill
                                    </button>
                                </div>
                            )}

                            {/* 6-Digit Code */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">
                                    6-Digit Clearance Code
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/30 text-center tracking-[0.5em] font-mono text-lg font-bold"
                                        placeholder="••••••"
                                    />
                                    <div className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors">
                                        <KeyRound size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">
                                    New Secure Credentials
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="Min. 6 characters"
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

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest text-blue-200/60 font-bold ml-1">
                                    Confirm New Credentials
                                </label>
                                <div className="relative group">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all placeholder-white/50 text-sm"
                                        placeholder="Repeat new password"
                                        autoComplete="new-password"
                                    />
                                    <div
                                        className="absolute right-4 top-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors cursor-pointer hover:text-white"
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
                                    className="text-blue-200/60 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft size={13} /> Change Email
                                </button>
                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleRequestCode}
                                        disabled={loading}
                                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Resend Code
                                    </button>
                                ) : (
                                    <span className="text-blue-200/40 text-[10px]">
                                        Resend in <span className="text-blue-300 font-mono font-bold">{countdown}s</span>
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group bg-blue-500 hover:bg-blue-400 text-white font-bold border border-transparent rounded-xl px-4 py-4 mt-4 transition-all duration-300 flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating Credentials...' : 'Authorize & Reset Credentials'}
                                <Shield size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        </form>
                    )}

                    {/* ============================================================
                        STEP 3: SUCCESS STATE
                    ============================================================ */}
                    {step === 3 && (
                        <div className="text-center py-6 space-y-5">
                            <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto text-blue-400">
                                <CheckCircle2 size={36} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Credentials Restored</h3>
                                <p className="text-xs text-blue-200/80 leading-relaxed font-sans max-w-xs mx-auto">
                                    Your corporate security credentials have been updated successfully.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link
                                    to="/login/boardroom"
                                    className="w-full inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-blue-50 font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-900/30"
                                >
                                    Access Boardroom Mainframe <ArrowRight size={14} />
                                </Link>
                            </div>
                            <p className="text-[10px] text-blue-200/40">
                                Redirecting automatically in 3 seconds...
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-2">Protected by</div>
                    <div className="flex items-center justify-center gap-2 opacity-30">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-bold tracking-widest text-[10px]">VOLCANO ENTERPRISE SECURITY &bull; DUAL FACTOR CLEARANCE</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BoardroomForgotPassword;
