import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, Volume2, Crown, MessageCircle } from 'lucide-react';
import { auth } from '../firebase/config';
import { gameService } from '../services/gameService';
import { telegramService } from '../services/telegramService';
import { GameRoom as GameRoomType, BingoCard } from '../types/game';
import BingoCardComponent from './BingoCard';
import toast from 'react-hot-toast';

const GameRoom: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameRoom, setGameRoom] = useState<GameRoomType | null>(null);
  const [bingoCard, setBingoCard] = useState<BingoCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    setLoading(true);

    const unsubscribe = gameService.subscribeToGameRoom(gameId, (room) => {
      setGameRoom(room);
      setLoading(false);

      // Generate bingo card for current player if not exists
      if (room && !bingoCard && auth.currentUser) {
        const newCard = gameService.generateBingoCard(auth.currentUser.uid);
        setBingoCard(newCard);
      }
    });

    return () => unsubscribe();
    // Only depend on gameId; bingoCard is set inside the callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handleMarkSquare = useCallback(
    (column: keyof Omit<BingoCard, 'id' | 'playerId'>, index: number) => {
      if (!bingoCard) return;

      setBingoCard(prev => {
        if (!prev) return prev;

        const newCard = { ...prev };
        newCard[column] = [...prev[column]];
        newCard[column][index] = {
          ...prev[column][index],
          marked: !prev[column][index].marked
        };

        // Check for win
        const winResult = gameService.checkWin(newCard);
        if (winResult.hasWon) {
          toast.success(`BINGO! You won with a ${winResult.pattern}!`);
          // Handle win logic here
        }

        return newCard;
      });
    },
    [bingoCard]
  );

  const handleStartGame = async () => {
    if (!gameId || !gameRoom) return;

    try {
      await gameService.startGame(gameId);
      toast.success('Game starting!');
    } catch (error) {
      toast.error('Failed to start game');
    }
  };

  const getNumberColor = (number: number) => {
    if (number === 0) return 'bg-emerald-500';
    if (number <= 15) return 'bg-blue-500';
    if (number <= 30) return 'bg-indigo-500';
    if (number <= 45) return 'bg-emerald-500';
    if (number <= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getLetterForNumber = (number: number) => {
    if (number === 0) return 'N';
    if (number <= 15) return 'B';
    if (number <= 30) return 'I';
    if (number <= 45) return 'N';
    if (number <= 60) return 'G';
    return 'O';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const isHost = gameRoom?.hostId === auth.currentUser?.uid;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (!loading && !gameRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                <span>{gameRoom?.name}</span>
                {isHost && <Crown className="w-6 h-6 text-yellow-400" />}
                {gameRoom?.telegramBotEnabled && <MessageCircle className="w-6 h-6 text-blue-400" />}
              </h1>
              <p className="text-white/80">
                {gameRoom?.status === 'waiting'
                  ? 'Waiting for players to join'
                  : gameRoom?.status === 'starting'
                  ? 'Game starting soon...'
                  : 'Game in progress'}
              </p>
            </div>
          </div>

          {/* Game Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-white/60 text-sm">Players</div>
              <div className="text-white font-bold">
                {gameRoom?.players.length}/{gameRoom?.maxPlayers}
              </div>
            </div>
            <div className="text-center">
              <div className="text-white/60 text-sm">Prize Pool</div>
              <div className="text-yellow-400 font-bold">
                {formatCurrency(gameRoom?.prizePool ?? 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Bingo Card */}
          <div className="lg:col-span-2">
            {bingoCard ? (
              <BingoCardComponent
                card={bingoCard}
                calledNumbers={gameRoom?.calledNumbers ?? []}
                onMarkSquare={handleMarkSquare}
                disabled={gameRoom?.status !== 'playing'}
              />
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
                <div className="text-white/60">Generating your bingo card...</div>
              </div>
            )}
          </div>

          {/* Game Controls & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Call */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">Current Call</h3>
              {gameRoom?.currentCall ? (
                <div className="text-center">
                  <div
                    className={`inline-block ${getNumberColor(
                      gameRoom.currentCall
                    )} text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mb-2`}
                  >
                    {gameRoom.currentCall}
                  </div>
                  <p className="text-white/80 text-lg font-semibold">
                    {getLetterForNumber(gameRoom.currentCall)}-{gameRoom.currentCall}
                  </p>
                </div>
              ) : (
                <div className="text-center text-white/60">
                  {gameRoom?.status === 'waiting'
                    ? 'Waiting for game to start'
                    : 'No number called yet'}
                </div>
              )}
            </div>

            {/* Game Controls */}
            {isHost && gameRoom && gameRoom.status === 'waiting' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-white text-lg font-semibold mb-4">Host Controls</h3>
                <button
                  onClick={handleStartGame}
                  disabled={gameRoom.players.length < 2}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Start Game</span>
                </button>
                {gameRoom.players.length < 2 && (
                  <p className="text-white/60 text-sm mt-2 text-center">
                    Need at least 2 players to start
                  </p>
                )}
              </div>
            )}

            {/* Players List */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Players ({gameRoom?.players.length ?? 0})</span>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {gameRoom?.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-semibold flex items-center space-x-2">
                          <span>{player.name}</span>
                          {player.id === gameRoom.hostId && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-white/60 text-xs">
                          {player.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        player.isOnline ? 'bg-green-400' : 'bg-gray-400'
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call History */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">
                Called Numbers ({gameRoom?.calledNumbers.length ?? 0}/75)
              </h3>
              <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto">
                {gameRoom?.calledNumbers.slice(-30).map(number => (
                  <div
                    key={number}
                    className={`${getNumberColor(
                      number
                    )} text-white text-center py-1 px-2 rounded text-sm font-semibold`}
                  >
                    {number}
                  </div>
                ))}
              </div>
              {gameRoom?.calledNumbers.length === 0 && (
                <div className="text-white/60 text-center">No numbers called yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;