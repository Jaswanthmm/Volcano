// Role-Aware Protected Route Component (FE-03)
// Guards protected views against unauthorized direct URL navigation and expired tokens.

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { isAuthenticated, getLoginPath } from '../utils/auth';

/**
 * ProtectedRoute Component
 * @param {object} props
 * @param {string} [props.role='alien'] - Expected role: 'alien' | 'titan' | 'admin'
 * @param {string[]} [props.allowedRoles] - Optional list of allowed roles
 * @param {React.ReactNode} [props.children] - Child components to render if authorized
 */
const ProtectedRoute = ({ role, allowedRoles, children }) => {
    const location = useLocation();

    // Determine target roles
    const targetRoles = allowedRoles || (role ? [role] : ['alien']);

    // Check if user is authenticated under at least one of the allowed roles
    const hasValidAuth = targetRoles.some(r => isAuthenticated(r));

    if (!hasValidAuth) {
        // Fall back to primary role's login path
        const primaryRole = targetRoles[0] || 'alien';
        const loginPath = getLoginPath(primaryRole);

        // Redirect to login while preserving target path for seamless return after authentication
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
