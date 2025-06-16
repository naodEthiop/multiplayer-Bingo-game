import React, { useState, useEffect } from 'react';
import { Plus, Users, Trophy, Clock, DollarSign, LogOut } from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { gameService } from '../services/gameService';
import { GameRoom } from '../types/game';
import CreateGameModal from './CreateGameModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const GameLobby: React.FC = () => {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = gameService.subscribeToGameRooms((rooms) => {
      setGameRooms(rooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleJoinGame = async (gameRoom: GameRoom) => {
    if (!auth.currentUser) return;

    if (gameRoom.entryFee > 0) {
      // Redirect to payment page
      navigate(`/payment/${gameRoom.id}`);
    } else {
      // Join free game directly
      try {
        const player = {
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Anonymous',
          email: auth.currentUser.email || '',
          isOnline: true,
          joinedAt: new Date()
        };

        await gameService.joinGameRoom(gameRoom.id, player);
        navigate(`/game/${gameRoom.id}`);
        toast.success('Joined game successfully!');
      } catch (error) {
        toast.error('Failed to join game');
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
      case 'waiting': return 'Waiting for Players';
      case 'starting': return 'Starting Soon';
      case 'playing': return 'In Progress';
      default: return 'Unknown';
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
            <p className="text-white/80 text-lg">Join games, win prizes, have fun!</p>
          </div>
          
          <div className="flex items-center space-x-4">
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

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <p className="text-lg font-semibold">{gameRooms.length} Active Games</p>
            <p className="text-sm opacity-80">Find a game or create your own</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Game</span>
          </button>
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
                  disabled={room.players.length >= room.maxPlayers || room.status !== 'waiting'}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    room.players.length >= room.maxPlayers || room.status !== 'waiting'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : room.entryFee > 0
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transform hover:scale-105'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transform hover:scale-105'
                  }`}
                >
                  {room.players.length >= room.maxPlayers
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
      </div>
    </div>
  );
};

export default GameLobby;