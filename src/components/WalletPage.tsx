import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Settings,
  Plus,
  Minus,
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { auth } from '../firebase/config';
import { walletService } from '../services/walletService';
import { Wallet as WalletType, Transaction, PaymentMethod } from '../types/wallet';
import DepositModal from './DepositModal';
import WithdrawalModal from './WithdrawalModal';
import TransactionHistory from './TransactionHistory';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface WalletPageProps {
  user: any;
  onNavigate: (page: string) => void;
  onBack?: () => void;
}

const WalletPage: React.FC<WalletPageProps> = ({ user, onNavigate, onBack }) => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize useNavigate


  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeWallet = walletService.subscribeToWallet(
      auth.currentUser.uid,
      (walletData) => {
        setWallet(walletData);
        setLoading(false);
      }
    );

    const unsubscribeTransactions = walletService.subscribeToTransactions(
      auth.currentUser.uid,
      setTransactions
    );

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const getRecentStats = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= lastWeek
    );

    const deposits = recentTransactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.metadata?.originalAmount || t.amount), 0);

    const withdrawals = recentTransactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.metadata?.originalAmount || t.amount), 0);

    const bets = recentTransactions
      .filter(t => t.type === 'bet')
      .reduce((sum, t) => sum + t.amount, 0);

    const wins = recentTransactions
      .filter(t => t.type === 'win')
      .reduce((sum, t) => sum + t.amount, 0);

    return { deposits, withdrawals, bets, wins };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading wallet...</div>
      </div>
    );
  }

  const stats = getRecentStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  My Wallet
                </span>
              </h1>
              <p className="text-white/80">Manage your funds and transactions</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-white/80 text-sm font-medium">Available Balance</p>
                <div className="flex items-center space-x-3">
                  <h2 className="text-4xl font-bold text-white">
                    {showBalance ? formatCurrency(wallet?.balance || 0) : '••••••'}
                  </h2>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-white/80 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Secured</span>
                </div>
                <p className="text-white/60 text-xs mt-1">
                  Status: {wallet?.status || 'Active'}
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Deposit</span>
              </button>
              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <Minus className="w-5 h-5" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <ArrowDownLeft className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Deposits</h3>
            <p className="text-green-400 text-2xl font-bold">{formatCurrency(stats.deposits)}</p>
            <p className="text-white/60 text-sm">Last 7 days</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500/20 p-3 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-red-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Withdrawals</h3>
            <p className="text-red-400 text-2xl font-bold">{formatCurrency(stats.withdrawals)}</p>
            <p className="text-white/60 text-sm">Last 7 days</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Bets Placed</h3>
            <p className="text-blue-400 text-2xl font-bold">{formatCurrency(stats.bets)}</p>
            <p className="text-white/60 text-sm">Last 7 days</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-yellow-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-white text-lg font-semibold">Winnings</h3>
            <p className="text-yellow-400 text-2xl font-bold">{formatCurrency(stats.wins)}</p>
            <p className="text-white/60 text-sm">Last 7 days</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-xl font-semibold flex items-center space-x-2">
              <History className="w-6 h-6" />
              <span>Recent Transactions</span>
            </h3>
            <button className="text-blue-400 hover:text-blue-300 font-semibold">
              View All
            </button>
          </div>

          <TransactionHistory transactions={transactions.slice(0, 10)} />
        </div>

        {/* Modals */}
        {showDepositModal && (
          <DepositModal
            onClose={() => setShowDepositModal(false)}
            wallet={wallet}
          />
        )}

        {showWithdrawalModal && (
          <WithdrawalModal
            onClose={() => setShowWithdrawalModal(false)}
            wallet={wallet}
          />
        )}
      </div>
    </div>
  );
};

export default WalletPage;