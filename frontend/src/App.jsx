
// Main React application component handling routing and global layout.
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AlienLogin from './pages/AlienLogin';
import BoardroomLogin from './pages/BoardroomLogin';
import AlienForgotPassword from './pages/AlienForgotPassword';
import BoardroomForgotPassword from './pages/BoardroomForgotPassword';
import AlienDashboard from './pages/AlienDashboard';
import BoardroomDashboard from './pages/BoardroomDashboard';
import ThinkingEngine from './pages/ThinkingEngine';

import ThinkingEngineLogin from './pages/ThinkingEngineLogin';
import AlienProfile from './pages/AlienProfile';
import BoardroomProfile from './pages/BoardroomProfile';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Disclosures from './pages/Disclosures';
import ErrorBoundary from './components/ErrorBoundary';
import SessionManager from './components/SessionManager';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <SessionManager />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/alien" element={<AlienLogin />} />
          {/* Supporting both shark and titan routes for backward compatibility/new naming */}
          <Route path="/login/boardroom" element={<BoardroomLogin />} />
          <Route path="/login/titan" element={<BoardroomLogin />} />

          {/* Password Recovery Routes */}
          <Route path="/forgot-password/alien" element={<AlienForgotPassword />} />
          <Route path="/forgot-password/boardroom" element={<BoardroomForgotPassword />} />
          <Route path="/forgot-password/titan" element={<BoardroomForgotPassword />} />

          {/* Protected Dashboard Routes (FE-03) */}
          <Route 
            path="/alien/dashboard" 
            element={
              <ProtectedRoute role="alien">
                <AlienDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/boardroom/dashboard" 
            element={
              <ProtectedRoute role="titan">
                <BoardroomDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Profile Routes */}
          <Route path="/alien/:id" element={<AlienProfile />} />
          <Route path="/boardroom/:id" element={<BoardroomProfile />} />

          {/* Thinking Engine Routes */}
          <Route path="/thinking-engine/login" element={<ThinkingEngineLogin />} />
          <Route 
            path="/thinking-engine" 
            element={
              <ProtectedRoute role="admin">
                <ThinkingEngine />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/volcano" 
            element={
              <ProtectedRoute role="admin">
                <ThinkingEngine />
              </ProtectedRoute>
            } 
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/disclosures" element={<Disclosures />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
