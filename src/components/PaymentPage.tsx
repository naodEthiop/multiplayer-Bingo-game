import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Shield, Clock } from 'lucide-react';
import { auth } from '../firebase/config';
import { gameService } from '../services/gameService';
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

  const handlePayment = async () => {
    if (!gameRoom || !auth.currentUser || !gameId) return;

    setProcessing(true);
    try {
      const tx_ref = `bingo-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const paymentData = {
        amount: gameRoom.entryFee,
        email: auth.currentUser.email || 'player@example.com',
        first_name: auth.currentUser.displayName?.split(' ')[0] || 'Player',
        last_name: auth.currentUser.displayName?.split(' ')[1] || 'User',
        tx_ref: tx_ref
      };

      // Record payment in database
      await gameService.recordPayment({
        playerId: auth.currentUser.uid,
        gameRoomId: gameId,
        amount: gameRoom.entryFee,
        currency: 'ETB',
        status: 'pending',
        chapaReference: tx_ref,
        createdAt: new Date()
      });

      const response = await fetch('http://0.0.0.0:5000/create-chapa-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.checkout_url) {
        // Redirect to Chapa payment page
        window.location.href = result.checkout_url;
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!gameRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-2xl font-bold ml-4">Payment</h1>
        </div>

        {/* Payment Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
          {/* Game Info */}
          <div className="mb-8">
            <h2 className="text-white text-xl font-bold mb-2">{gameRoom.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-white/80">
              <div>
                <span className="block text-sm">Entry Fee</span>
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrency(gameRoom.entryFee)}
                </span>
              </div>
              <div>
                <span className="block text-sm">Players</span>
                <span className="text-lg font-semibold">
                  {gameRoom.players.length}/{gameRoom.maxPlayers}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="text-white text-lg font-semibold mb-4">Payment Method</h3>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <div>
                  <div className="text-white font-semibold">Chapa Payment</div>
                  <div className="text-white/60 text-sm">Secure payment gateway</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Pay {formatCurrency(gameRoom.entryFee)}</span>
              </>
            )}
          </button>

          {/* Payment Info */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-2 text-white/60">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Payment processing usually takes 1-2 minutes</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Secure Payment</span>
            </div>
            <p className="text-white/80 text-sm">
              Your payment is processed securely through <b>Chapa</b>. We never store your payment information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;