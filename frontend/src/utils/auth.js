// Centralized JWT Authentication & Session Utilities for Volcano
// Supports Alien (Innovator), Titan (Boardroom), and Admin (Thinking Engine) roles.

const ROLE_STORAGE_MAP = {
    alien: {
        tokenKey: 'alien_token',
        refreshKey: 'alien_refresh_token',
        userKey: 'alien_user',
        loginPath: '/login/alien'
    },
    titan: {
        tokenKey: 'titan_token',
        refreshKey: 'titan_refresh_token',
        userKey: 'titan_user',
        loginPath: '/login/boardroom'
    },
    boardroom: {
        tokenKey: 'titan_token',
        refreshKey: 'titan_refresh_token',
        userKey: 'titan_user',
        loginPath: '/login/boardroom'
    },
    admin: {
        tokenKey: 'thinking_engine_token',
        refreshKey: 'thinking_engine_refresh_token',
        userKey: 'thinking_engine_user',
        loginPath: '/thinking-engine/login'
    },
    thinking_engine: {
        tokenKey: 'thinking_engine_token',
        refreshKey: 'thinking_engine_refresh_token',
        userKey: 'thinking_engine_user',
        loginPath: '/thinking-engine/login'
    }
};

/**
 * Safely parse a base64url encoded JWT payload.
 * @param {string} token 
 * @returns {object|null}
 */
export function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (err) {
        console.warn('Failed to parse JWT:', err);
        return null;
    }
}

/**
 * Check whether a JWT token is expired.
 * @param {string} token 
 * @returns {boolean}
 */
export function isTokenExpired(token) {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    // 5-second buffer for clock skew
    return payload.exp <= (nowInSeconds + 5);
}

/**
 * Normalizes a role key to one of: 'alien', 'titan', or 'admin'.
 */
export function normalizeRole(role) {
    if (!role) return 'alien';
    const r = role.toLowerCase();
    if (r === 'boardroom' || r === 'company' || r === 'titan') return 'titan';
    if (r === 'admin' || r === 'thinking_engine' || r === 'volcano') return 'admin';
    return 'alien';
}

/**
 * Retrieve the active access token for a role, verifying it has not expired.
 * If expired, clears the session.
 */
export function getAuthToken(role = 'alien') {
    const config = ROLE_STORAGE_MAP[normalizeRole(role)];
    if (!config) return null;
    const token = localStorage.getItem(config.tokenKey);
    if (!token) return null;

    if (isTokenExpired(token)) {
        clearAuthSession(role);
        return null;
    }
    return token;
}

/**
 * Retrieve the refresh token for a role.
 */
export function getRefreshToken(role = 'alien') {
    const config = ROLE_STORAGE_MAP[normalizeRole(role)];
    return config ? localStorage.getItem(config.refreshKey) : null;
}

/**
 * Retrieve the stored user/company info object for a role.
 */
export function getAuthUser(role = 'alien') {
    const config = ROLE_STORAGE_MAP[normalizeRole(role)];
    if (!config) return null;
    const raw = localStorage.getItem(config.userKey);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Persist tokens and user info in localStorage upon login/register.
 */
export function setAuthSession(role, { access_token, refresh_token, user_info }) {
    const norm = normalizeRole(role);
    const config = ROLE_STORAGE_MAP[norm];
    if (!config) return;

    if (access_token) {
        localStorage.setItem(config.tokenKey, access_token);
    }
    if (refresh_token) {
        localStorage.setItem(config.refreshKey, refresh_token);
    }
    if (user_info) {
        localStorage.setItem(config.userKey, JSON.stringify(user_info));
    }
}

/**
 * Remove all authentication tokens and info for a role.
 */
export function clearAuthSession(role) {
    const norm = normalizeRole(role);
    const config = ROLE_STORAGE_MAP[norm];
    if (!config) return;

    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.refreshKey);
    localStorage.removeItem(config.userKey);
}

/**
 * Clear all authentication sessions across all roles.
 */
export function clearAllSessions() {
    ['alien', 'titan', 'admin'].forEach(r => clearAuthSession(r));
}

/**
 * Verify whether an active, valid authentication session exists for a role.
 */
export function isAuthenticated(role = 'alien') {
    const token = getAuthToken(role);
    return Boolean(token);
}

/**
 * Get login path for a given role.
 */
export function getLoginPath(role = 'alien') {
    const config = ROLE_STORAGE_MAP[normalizeRole(role)];
    return config ? config.loginPath : '/';
}

/**
 * Authenticated Fetch wrapper.
 * Automatically injects Bearer token and redirects to login on 401 Unauthorized.
 * 
 * @param {string} url 
 * @param {RequestInit} options 
 * @param {string} role 'alien' | 'titan' | 'admin'
 * @returns {Promise<Response>}
 */
export async function authFetch(url, options = {}, role = 'alien') {
    const token = getAuthToken(role);
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const mergedOptions = {
        ...options,
        headers
    };

    const response = await fetch(url, mergedOptions);

    // If unauthorized, clear stale credentials and redirect to login
    if (response.status === 401) {
        console.warn(`[authFetch] 401 Unauthorized for role '${role}'. Purging session.`);
        clearAuthSession(role);
        const loginPath = getLoginPath(role);
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith(loginPath)) {
            window.location.href = `${loginPath}?session_expired=true`;
        }
    }

    return response;
}
