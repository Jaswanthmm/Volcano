
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../utils/auth';

const LOGOUT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const SessionManager = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const timerRef = useRef(null);

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleLogout, LOGOUT_TIMEOUT_MS);
    };

    const handleLogout = () => {
        const path = location.pathname;

        if (path.startsWith('/alien') || path.startsWith('/login/alien')) {
            // Alien Logout
            clearAuthSession('alien');
            if (!path.startsWith('/login/alien')) {
                navigate('/login/alien?timeout=true');
            }
        }
        else if (path.startsWith('/boardroom') || path.startsWith('/login/boardroom') || path.startsWith('/login/titan')) {
            // Boardroom / Titan Logout
            clearAuthSession('titan');
            if (!path.startsWith('/login/boardroom') && !path.startsWith('/login/titan')) {
                navigate('/login/boardroom?timeout=true');
            }
        }
        else if (path.startsWith('/thinking-engine') || path.startsWith('/volcano')) {
            // Thinking Engine Admin Logout
            clearAuthSession('admin');
            if (!path.startsWith('/thinking-engine/login')) {
                navigate('/thinking-engine/login?timeout=true');
            }
        }
    };

    useEffect(() => {
        // Only run on authenticated routes (simple check by path prefix)
        // If user is on landing page ('/'), no need to logout really, but let's keep it clean.

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        const onActivity = () => {
            resetTimer();
        };

        // Attach listeners
        events.forEach(event => window.addEventListener(event, onActivity));

        // Initial set
        resetTimer();

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => window.removeEventListener(event, onActivity));
        };
    }, [location.pathname]); // Reset timer on route change too

    return null; // Invisible component
};

export default SessionManager;
