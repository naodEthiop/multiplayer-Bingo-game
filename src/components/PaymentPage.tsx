import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Shield, Clock } from 'lucide-react';
import { auth } from '../firebase/config';
import { gameService } from '../services/gameService';
import { initiateTelebirrSubscription } from '../services/telebirrService';
import { GameRoom } from '../types/game';
import toast from 'react-hot-toast';

const PaymentPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = gameService.subscribeToGameRoom(gameId, (room) => {
      setGameRoom(room);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  // ...existing code...

const handlePayment = async () => {
  if (!gameRoom || !auth.currentUser || !gameId) return;

  setProcessing(true);
  try {
    const subscriptionId = `bingo-sub-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const subscriptionData = {
      subscriptionId,
      subject: `Bingo Game Subscription for ${gameRoom.name}`,
      amount: gameRoom.entryFee,
      returnUrl: `${window.location.origin}/game/${gameId}`,
      period: "MONTH", // or "WEEK", "DAY" as needed
      interval: 1      // every 1 month
    };

    // Record payment in database (optional, adjust as needed)
    await gameService.recordPayment({
      playerId: auth.currentUser.uid,
      gameRoomId: gameId,
      amount: gameRoom.entryFee,
      currency: 'ETB',
      status: 'pending',
      chapaReference: subscriptionId, // Add a unique reference for this payment
      createdAt: new Date()
    });

    const subscriptionUrl = await initiateTelebirrSubscription(subscriptionData);

    // Redirect to Telebirr subscription authorization page
    window.location.href = subscriptionUrl;
  } catch (error) {
    toast.error('Subscription payment failed. Please try again.');
    console.error('Payment error:', error);
  } finally {
    setProcessing(false);
  }
};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!gameRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Payment Required</h1>
            <p className="text-white/80">Complete payment to join the game</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Game Details</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-white/80">Game Name</span>
                <span className="text-white font-semibold">{gameRoom.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/80">Entry Fee</span>
                <span className="text-white font-semibold">{formatCurrency(gameRoom.entryFee)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/80">Current Prize Pool</span>
                <span className="text-yellow-400 font-semibold">{formatCurrency(gameRoom.prizePool)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/80">Players</span>
                <span className="text-white font-semibold">{gameRoom.players.length}/{gameRoom.maxPlayers}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/80">Status</span>
                <span className="text-green-400 font-semibold">
                  {gameRoom.status === 'waiting' ? 'Waiting for Players' : 'Starting Soon'}
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-400 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Secure Payment</span>
              </div>
              <p className="text-white/80 text-sm">
                Your payment is processed securely through <b>Telebirr</b> We never store your payment information.
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Payment Information</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Player Name
                </label>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                  {auth.currentUser?.displayName || 'Anonymous Player'}
                </div>
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                  {auth.currentUser?.email}
                </div>
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Amount to Pay
                </label>
                <div className="px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 font-bold text-xl">
                  {formatCurrency(gameRoom.entryFee)}
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={processing || gameRoom.status !== 'waiting'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {processing ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay with Telebirr</span>
                </>
              )}
            </button>

            {gameRoom.status !== 'waiting' && (
              <div className="mt-4 text-center text-yellow-400 text-sm">
                ⚠️ Game has already started. Payment is no longer available.
              </div>
            )}

            {/* Payment Methods */}
            <div className="mt-6">
              <p className="text-white/60 text-sm text-center mb-3">Supported Payment Methods</p>
              <div className="flex justify-center space-x-4">
                <div className="bg-white/10 px-3 py-2 rounded text-white/80 text-xs">CBE Birr</div>
                <div className="bg-white/10 px-3 py-2 rounded text-white/80 text-xs">Telebirr</div>
                <div className="bg-white/10 px-3 py-2 rounded text-white/80 text-xs">Bank Cards</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;