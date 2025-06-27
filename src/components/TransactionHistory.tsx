import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Trophy, 
  RefreshCw,
  Gift,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Transaction } from '../types/wallet';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

interface TransactionHistoryProps {
  userId: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!userId) return; // Don't run query if userId is not set

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(txns);
    });

    return () => unsubscribe();
  }, [userId]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case 'withdrawal': return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case 'bet': return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'win': return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'refund': return <RefreshCw className="w-5 h-5 text-purple-400" />;
      case 'bonus': return <Gift className="w-5 h-5 text-pink-400" />;
      case 'fee': return <DollarSign className="w-5 h-5 text-gray-400" />;
      default: return <DollarSign className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'processing': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'refund':
      case 'bonus':
        return 'text-green-400';
      case 'withdrawal':
      case 'bet':
      case 'fee':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'refund':
      case 'bonus':
        return '+';
      case 'withdrawal':
      case 'bet':
      case 'fee':
        return '-';
      default:
        return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const formatDate = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-white/40 mb-2">
          <CreditCard className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-white/60">No transactions yet</p>
        <p className="text-white/40 text-sm">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 p-2 rounded-lg">
                {getTransactionIcon(transaction.type)}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-white font-semibold">
                    {capitalizeFirst(transaction.type)}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(transaction.status)}
                    <span className={`text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {capitalizeFirst(transaction.status)}
                    </span>
                  </div>
                </div>
                
                <p className="text-white/60 text-sm">{transaction.description}</p>
                
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-white/40 text-xs">
                    {formatDate(transaction.createdAt)}
                  </span>
                  
                  {transaction.reference && (
                    <span className="text-white/40 text-xs">
                      Ref: {transaction.reference.slice(-8)}
                    </span>
                  )}
                  
                  {transaction.paymentMethod && (
                    <span className="text-white/40 text-xs">
                      via {transaction.paymentMethod.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                {getAmountPrefix(transaction.type)}{formatCurrency(
                  transaction.metadata?.originalAmount || transaction.amount
                )}
              </div>
              
              {transaction.metadata?.fee && transaction.metadata.fee > 0 && (
                <div className="text-white/40 text-xs">
                  Fee: {formatCurrency(transaction.metadata.fee)}
                </div>
              )}
              
              {transaction.gameId && (
                <div className="text-white/40 text-xs">
                  Game: {transaction.gameId.slice(-6)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;