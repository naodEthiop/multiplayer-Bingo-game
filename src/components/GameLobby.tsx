import React, { useState, useEffect } from 'react';
import { Plus, Users, Trophy, Clock, DollarSign, LogOut, Wallet, Volume2, Settings, Wifi, WifiOff } from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { gameService } from '../services/gameService';
import { walletService } from '../services/walletService';
import { languageService } from '../services/languageService';
import { voiceService } from '../services/voiceService';
import { GameRoom } from '../types/game';
import { Wallet as WalletType } from '../types/wallet';
import CreateGameModal from './CreateGameModal';
import VoiceSettings from './VoiceSettings';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface GameLobbyProps {
  onShowGameList: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onShowGameList }) => {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [currentLanguage, setCurrentLanguage] = useState(languageService.getCurrentLanguage());
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeGameRooms: (() => void) | null = null;
    
    const setupGameRoomsSubscription = () => {
      try {
        unsubscribeGameRooms = gameService.subscribeToGameRooms((rooms) => {
          setGameRooms(rooms);
          setLoading(false);
          setConnectionStatus('online');
        });
      } catch (error) {
        console.error('Failed to subscribe to game rooms:', error);
        setConnectionStatus('offline');
        setLoading(false);
        
        // Retry after 5 seconds
        setTimeout(setupGameRoomsSubscription, 5000);
      }
    };

    setupGameRoomsSubscription();

    return () => {
      if (unsubscribeGameRooms) {
        unsubscribeGameRooms();
      }
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    let unsubscribeWallet: (() => void) | null = null;
    
    const setupWalletSubscription = () => {
      try {
        unsubscribeWallet = walletService.subscribeToWallet(
          auth.currentUser!.uid,
          (walletData) => {
            setWallet(walletData);
            setConnectionStatus('online');
          }
        );
      } catch (error) {
        console.error('Failed to subscribe to wallet:', error);
        setConnectionStatus('offline');
        
        // Retry after 5 seconds
        setTimeout(setupWalletSubscription, 5000);
      }
    };

    setupWalletSubscription();

    return () => {
      if (unsubscribeWallet) {
        unsubscribeWallet();
      }
    };
  }, []);

  useEffect(() => {
    // Update language when it changes
    setCurrentLanguage(languageService.getCurrentLanguage());
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      toast.error('Connection lost - working offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleJoinGame = async (gameRoom: GameRoom) => {
    if (!auth.currentUser) return;

    if (connectionStatus === 'offline') {
      toast.error('Cannot join game while offline. Please check your connection.');
      return;
    }

    // Check wallet balance if game has entry fee
    if (gameRoom.entryFee > 0) {
      if (!wallet || wallet.balance < gameRoom.entryFee) {
        toast.error('Insufficient balance. Please deposit funds first.');
        navigate('/wallet');
        return;
      }

      try {
        // Place bet (deduct entry fee from wallet)
        await walletService.placeBet(
          auth.currentUser.uid,
          gameRoom.id,
          gameRoom.entryFee,
          { gameType: 'bingo', gameName: gameRoom.name }
        );

        // Join the game
        const player = {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Anonymous',
          email: auth.currentUser.email || '',
          isOnline: true,
          avatar: auth.currentUser.photoURL || '',
          telegramId: '',
        };

        await gameService.joinGameRoom(gameRoom.id, player);
        navigate(`/game/${gameRoom.id}`);
        toast.success('Joined game successfully!');
      } catch (error) {
        console.error('Error joining game:', error);
        toast.error('Failed to join game. Please try again.');
      }
    } else {
      // Free game - join directly
      try {
        const player = {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Anonymous',
          email: auth.currentUser.email || '',
          isOnline: true,
          avatar: auth.currentUser.photoURL || '',
          telegramId: '',
        };

        await gameService.joinGameRoom(gameRoom.id, player);
        navigate(`/game/${gameRoom.id}`);
        toast.success('Joined game successfully!');
      } catch (error) {
        console.error('Error joining game:', error);
        toast.error('Failed to join game. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-500';
      case 'starting': return 'bg-yellow-500';
      case 'playing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return currentLanguage.phrases.waitingForPlayers || 'Waiting for Players';
      case 'starting': return currentLanguage.phrases.gameStarting || 'Starting Soon';
      case 'playing': return currentLanguage.phrases.gameStarted || 'In Progress';
      default: return 'Unknown';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'online': return <Wifi className="w-4 h-4 text-green-400" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-400" />;
      case 'connecting': return <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                MULTIPLAYER BINGO
              </span>
            </h1>
            <p className="text-white/80 text-lg">
              {currentLanguage.code === 'am-ET' ? 'ጨዋታዎችን ተቀላቀሉ፣ ሽልማቶችን ያሸንፉ፣ ይዝናኑ!' :
               currentLanguage.code === 'om-ET' ? 'Taphoota makamuu, badhaasa mo\'aa, gammadaa!' :
               currentLanguage.code === 'ti-ET' ? 'ጸወታታት ተሳተፉ፣ ሽልማት ዓወቱ፣ ተዘናጉዑ!' :
               'Join games, win prizes, have fun!'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
              {getConnectionIcon()}
              <span className="text-white/80 text-sm capitalize">{connectionStatus}</span>
            </div>

            {/* Voice Settings Button */}
            <button
              onClick={() => setShowVoiceSettings(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105"
              title="Voice & Language Settings"
            >
              <Volume2 className="w-4 h-4" />
              <span>{currentLanguage.nativeName}</span>
            </button>

            {/* Wallet Balance */}
            <button
              onClick={() => navigate('/wallet')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all transform hover:scale-105"
            >
              <Wallet className="w-4 h-4" />
              <span>{formatCurrency(wallet?.balance || 0)}</span>
            </button>
            
            <div className="text-white text-right">
              <p className="text-sm opacity-80">Welcome back,</p>
              <p className="font-semibold">{auth.currentUser?.displayName || 'Player'}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Connection Warning */}
        {connectionStatus === 'offline' && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-400">
              <WifiOff className="w-5 h-5" />
              <span className="font-semibold">Connection Lost</span>
            </div>
            <p className="text-white/80 text-sm mt-1">
              You're currently offline. Some features may not be available. The app will automatically reconnect when your connection is restored.
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <p className="text-lg font-semibold">{gameRooms.length} Active Games</p>
            <p className="text-sm opacity-80">Find a game or create your own</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/wallet')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all transform hover:scale-105"
            >
              <Wallet className="w-5 h-5" />
              <span>Wallet</span>
            </button>
            <button
              onClick={onShowGameList}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all transform hover:scale-105"
            >
              <Users className="w-5 h-5" />
              <span>View Games</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={connectionStatus === 'offline'}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all transform hover:scale-105 disabled:transform-none"
            >
              <Plus className="w-5 h-5" />
              <span>Create Game</span>
            </button>
          </div>
        </div>

        {/* Game Rooms Grid */}
        {loading ? (
          <div className="text-center text-white text-xl">Loading games...</div>
        ) : gameRooms.length === 0 ? (
          <div className="text-center text-white/80 py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No active games</h3>
            <p>Be the first to create a game!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105"
              >
                {/* Game Status */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white text-xl font-bold mb-1">{room.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(room.status)}`}></div>
                      <span className="text-white/80 text-sm">{getStatusText(room.status)}</span>
                    </div>
                  </div>
                  {room.telegramBotEnabled && (
                    <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      TELEGRAM
                    </div>
                  )}
                </div>

                {/* Game Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Players</span>
                    </div>
                    <span className="font-semibold">
                      {room.players.length}/{room.maxPlayers}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Entry Fee</span>
                    </div>
                    <span className="font-semibold">
                      {room.entryFee === 0 ? 'FREE' : formatCurrency(room.entryFee)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4" />
                      <span>Prize Pool</span>
                    </div>
                    <span className="font-semibold text-yellow-400">
                      {formatCurrency(room.prizePool)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                    <span className="font-semibold">
                      {new Date(room.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoinGame(room)}
                  disabled={room.players.length >= room.maxPlayers || room.status !== 'waiting' || connectionStatus === 'offline'}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    room.players.length >= room.maxPlayers || room.status !== 'waiting' || connectionStatus === 'offline'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : room.entryFee > 0
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transform hover:scale-105'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transform hover:scale-105'
                  }`}
                >
                  {connectionStatus === 'offline'
                    ? 'Offline'
                    : room.players.length >= room.maxPlayers
                    ? 'Game Full'
                    : room.status !== 'waiting'
                    ? 'Game Started'
                    : room.entryFee > 0
                    ? `Pay ${formatCurrency(room.entryFee)} & Join`
                    : 'Join Free Game'
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Game Modal */}
        {showCreateModal && (
          <CreateGameModal
            onClose={() => setShowCreateModal(false)}
            onGameCreated={(gameId) => {
              setShowCreateModal(false);
              navigate(`/game/${gameId}`);
            }}
          />
        )}

        {/* Voice Settings Modal */}
        <VoiceSettings
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
        />
      </div>
    </div>
  );
};

export default GameLobby;