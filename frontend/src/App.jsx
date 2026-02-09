import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AlienLogin from './pages/AlienLogin';
import BoardroomLogin from './pages/BoardroomLogin';
import AlienDashboard from './pages/AlienDashboard';
import BoardroomDashboard from './pages/BoardroomDashboard';
import ThinkingEngine from './pages/ThinkingEngine';

import ThinkingEngineLogin from './pages/ThinkingEngineLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/alien" element={<AlienLogin />} />
        {/* Supporting both shark and titan routes for backward compatibility/new naming */}
        <Route path="/login/boardroom" element={<BoardroomLogin />} />
        <Route path="/login/titan" element={<BoardroomLogin />} />
        <Route path="/alien/dashboard" element={<AlienDashboard />} />
        <Route path="/boardroom/dashboard" element={<BoardroomDashboard />} />

        {/* Thinking Engine Routes */}
        <Route path="/thinking-engine/login" element={<ThinkingEngineLogin />} />
        <Route path="/thinking-engine" element={<ThinkingEngine />} />
        <Route path="/volcano" element={<ThinkingEngine />} /> {/* Alias for backward compatibility */}
      </Routes>
    </Router>
  );
}

export default App;
