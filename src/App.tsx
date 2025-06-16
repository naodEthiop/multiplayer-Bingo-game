import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { auth } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';
import AuthPage from './components/AuthPage';
import CreateGameModal from './components/CreateGameModal';
import PaymentPage from './components/PaymentPage';
import { GameProvider } from './contexts/GameContext';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <GameProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <Routes>
            <Route 
              path="/" 
              element={user ? <GameLobby /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/auth" 
              element={!user ? <AuthPage /> : <Navigate to="/" />} 
            />
            <Route 
              path="/game/:gameId" 
              element={user ? <GameRoom /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/payment/:gameId" 
              element={user ? <PaymentPage /> : <Navigate to="/auth" />} 
            />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;