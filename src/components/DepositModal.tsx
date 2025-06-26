import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building, Shield, AlertCircle } from 'lucide-react';
import { walletService } from '../services/walletService';
import { PaymentMethod } from '../types/wallet';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

interface DepositModalProps {
  onClose: () => void;
  wallet: any;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'telebirr',
    type: 'telebirr',
    name: 'Telebirr',
    details: { provider: 'Ethio Telecom' },
    isActive: true,
    fees: { deposit: { fixed: 0, percentage: 1.5 }, withdrawal: { fixed: 5, percentage: 2 } },
    limits: { minDeposit: 10, maxDeposit: 50000, minWithdrawal: 50, maxWithdrawal: 25000, dailyLimit: 100000 }
  },
  {
    id: 'cbe_birr',
    type: 'cbe_birr',
    name: 'CBE Birr',
    details: { provider: 'Commercial Bank of Ethiopia' },
    isActive: true,
    fees: { deposit: { fixed: 0, percentage: 1 }, withdrawal: { fixed: 10, percentage: 1.5 } },
    limits: { minDeposit: 25, maxDeposit: 100000, minWithdrawal: 100, maxWithdrawal: 50000, dailyLimit: 200000 }
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    details: { type: 'Direct Bank Transfer' },
    isActive: true,
    fees: { deposit: { fixed: 15, percentage: 0 }, withdrawal: { fixed: 25, percentage: 0 } },
    limits: { minDeposit: 100, maxDeposit: 500000, minWithdrawal: 500, maxWithdrawal: 200000, dailyLimit: 1000000 }
  }
];

const DepositModal: React.FC<DepositModalProps> = ({ onClose, wallet }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'method' | 'amount' | 'confirm'>('method');

  const calculateFee = (amount: number) => {
    return selectedMethod.fees.deposit.fixed + (amount * selectedMethod.fees.deposit.percentage / 100);
  };

  const calculateTotal = (amount: number) => {
    return amount + calculateFee(amount);
  };

  const handleDeposit = async () => {
    if (!auth.currentUser || !amount) return;

    const depositAmount = parseFloat(amount);
    if (depositAmount < selectedMethod.limits.minDeposit) {
      toast.error(`Minimum deposit amount is ${selectedMethod.limits.minDeposit} ETB`);
      return;
    }

    if (depositAmount > selectedMethod.limits.maxDeposit) {
      toast.error(`Maximum deposit amount is ${selectedMethod.limits.maxDeposit} ETB`);
      return;
    }

    setLoading(true);
    try {
      // Call Python backend for Chapa payment
      const response = await fetch('http://0.0.0.0:5000/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          amount: depositAmount,
          paymentMethod: selectedMethod,
          email: auth.currentUser.email,
          firstName: auth.currentUser.displayName?.split(' ')[0] || 'User',
          lastName: auth.currentUser.displayName?.split(' ')[1] || 'Player'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to Chapa checkout
        window.location.href = result.checkout_url;
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Deposit failed');
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

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'telebirr': return <Smartphone className="w-6 h-6" />;
      case 'cbe_birr': return <CreditCard className="w-6 h-6" />;
      case 'bank_transfer': return <Building className="w-6 h-6" />;
      default: return <CreditCard className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'method' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'
            }`}>
              1
            </div>
            <div className="w-8 h-0.5 bg-white/20"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'amount' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'
            }`}>
              2
            </div>
            <div className="w-8 h-0.5 bg-white/20"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Payment Method */}
        {step === 'method' && (
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Select Payment Method</h3>
            {PAYMENT_METHODS.filter(method => method.isActive).map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedMethod.id === method.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-white">
                    {getMethodIcon(method.type)}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-white font-semibold">{method.name}</h4>
                    <p className="text-white/60 text-sm">
                      Fee: {method.fees.deposit.percentage}% + {formatCurrency(method.fees.deposit.fixed)}
                    </p>
                    <p className="text-white/60 text-xs">
                      Limit: {formatCurrency(method.limits.minDeposit)} - {formatCurrency(method.limits.maxDeposit)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            
            <button
              onClick={() => setStep('amount')}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && (
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Enter Amount</h3>
            
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">
                Deposit Amount (ETB)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min={selectedMethod.limits.minDeposit}
                max={selectedMethod.limits.maxDeposit}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-white/60 text-xs mt-1">
                Min: {formatCurrency(selectedMethod.limits.minDeposit)} - Max: {formatCurrency(selectedMethod.limits.maxDeposit)}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className="bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors"
                >
                  {formatCurrency(quickAmount)}
                </button>
              ))}
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-semibold mb-2">Transaction Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-white/80">
                    <span>Amount:</span>
                    <span>{formatCurrency(parseFloat(amount))}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Fee:</span>
                    <span>{formatCurrency(calculateFee(parseFloat(amount)))}</span>
                  </div>
                  <div className="border-t border-blue-500/30 pt-1 mt-2">
                    <div className="flex justify-between text-blue-400 font-semibold">
                      <span>Total to Pay:</span>
                      <span>{formatCurrency(calculateTotal(parseFloat(amount)))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('method')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!amount || parseFloat(amount) < selectedMethod.limits.minDeposit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Confirm Deposit</h3>
            
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-white/80">Payment Method:</span>
                <span className="text-white font-semibold">{selectedMethod.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Amount:</span>
                <span className="text-white font-semibold">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Fee:</span>
                <span className="text-white font-semibold">{formatCurrency(calculateFee(parseFloat(amount)))}</span>
              </div>
              <div className="border-t border-white/20 pt-2">
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total to Pay:</span>
                  <span className="text-green-400 font-bold text-lg">{formatCurrency(calculateTotal(parseFloat(amount)))}</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-yellow-400 text-sm">
                  <p className="font-semibold mb-1">Important Notice:</p>
                  <p>You will be redirected to {selectedMethod.name} to complete the payment. Please ensure you have sufficient balance in your account.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDeposit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Confirm Deposit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;