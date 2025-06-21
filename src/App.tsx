import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { auth } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';
import AuthPage from './components/AuthPage';
import PaymentPage from './components/PaymentPage';
import WalletPage from './components/WalletPage';
import GameList from './components/GameList';
import { GameProvider } from './contexts/GameContext';


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGameList, setShowGameList] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handler for selecting a game from GameList
  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setShowGameList(false);
  };
  const handleBackToMenu = () => {
    setShowGameList(false); }

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
              element={
                user ? (
                  showGameList ? (
                    <GameList
                     onSelectGame={handleSelectGame}
                     onBack={handleBackToMenu} />
                  ) : selectedGameId ? (
                    <Navigate to={`/game/${selectedGameId}`} />
                  ) : (
                    <GameLobby onShowGameList={() => setShowGameList(true)} />
                  )
                ) : (
                  <Navigate to="/auth" />
                )
              }
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
            <Route 
              path="/wallet" 
              element={user ? <WalletPage /> : <Navigate to="/auth" />} 
            />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;