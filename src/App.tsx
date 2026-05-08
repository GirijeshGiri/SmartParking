/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Home from './pages/Home';
import Auth from './pages/Auth';
import GateScanner from './pages/GateScanner';
import DisplayBoard from './pages/DisplayBoard';
import Navigation from './pages/Navigation';
import MyBookings from './pages/MyBookings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">SmartParkAI</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/gate" element={<GateScanner />} />
          <Route path="/display" element={<DisplayBoard />} />
          <Route path="/navigate" element={user ? <Navigation /> : <Navigate to="/auth" />} />
          <Route path="/bookings" element={user ? <MyBookings /> : <Navigate to="/auth" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
