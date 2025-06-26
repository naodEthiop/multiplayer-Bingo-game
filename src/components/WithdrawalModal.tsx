import React, { useState } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

interface WithdrawalModalProps {
  onClose: () => void;
  wallet: any;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ onClose, wallet }) => {
  const [amount, setAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleWithdrawal = async () => {
    if (!auth.currentUser || !amount || !phoneNumber) return;

    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount < 50) {
      toast.error('Minimum withdrawal amount is 50 ETB');
      return;
    }

    if (withdrawalAmount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      // Call Python backend for withdrawal processing
      const response = await fetch('http://0.0.0.0:5000/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          amount: withdrawalAmount,
          phoneNumber: phoneNumber
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Withdrawal request submitted! It will be processed within 24 hours.');
        onClose();
      } else {
        throw new Error(result.error || 'Withdrawal request failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Available Balance */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="text-center">
            <p className="text-white/80 text-sm">Available Balance</p>
            <p className="text-blue-400 text-2xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2">
              Withdrawal Amount (ETB)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="50"
              max={wallet?.balance || 0}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-white/60 text-xs mt-1">
              Min: {formatCurrency(50)} - Available: {formatCurrency(wallet?.balance || 0)}
            </p>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2">
              Phone Number (for mobile money)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+251912345678"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="text-yellow-400 text-sm">
                <p className="font-semibold mb-1">Processing Time:</p>
                <p>Withdrawals are processed within 24 hours during business days.</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div className="text-orange-400 text-sm">
                <p className="font-semibold mb-1">Important:</p>
                <p>Please ensure your phone number is correct. Incorrect details may result in failed transfers.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleWithdrawal}
            disabled={loading || !amount || !phoneNumber || parseFloat(amount) < 50}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>Submit Withdrawal Request</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;