import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Building, Shield, AlertTriangle, Clock } from 'lucide-react';
import { walletService } from '../services/walletService';
import { PaymentMethod } from '../types/wallet';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

interface WithdrawalModalProps {
  onClose: () => void;
  wallet: any;
}

const WITHDRAWAL_METHODS: PaymentMethod[] = [
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

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ onClose, wallet }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(WITHDRAWAL_METHODS[0]);
  const [amount, setAmount] = useState<string>('');
  const [accountDetails, setAccountDetails] = useState({
    phoneNumber: '',
    accountNumber: '',
    bankName: '',
    accountHolderName: '',
    swiftCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'method' | 'amount' | 'details' | 'confirm'>('method');

  const calculateFee = (amount: number) => {
    return selectedMethod.fees.withdrawal.fixed + (amount * selectedMethod.fees.withdrawal.percentage / 100);
  };

  const calculateNet = (amount: number) => {
    return amount - calculateFee(amount);
  };

  const handleWithdrawal = async () => {
    if (!auth.currentUser || !amount) return;

    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount < selectedMethod.limits.minWithdrawal) {
      toast.error(`Minimum withdrawal amount is ${selectedMethod.limits.minWithdrawal} ETB`);
      return;
    }

    if (withdrawalAmount > selectedMethod.limits.maxWithdrawal) {
      toast.error(`Maximum withdrawal amount is ${selectedMethod.limits.maxWithdrawal} ETB`);
      return;
    }

    if (withdrawalAmount + calculateFee(withdrawalAmount) > wallet.balance) {
      toast.error('Insufficient balance including fees');
      return;
    }

    setLoading(true);
    try {
      let withdrawalDetails: any = {};

      if (selectedMethod.type === 'telebirr' || selectedMethod.type === 'cbe_birr') {
        withdrawalDetails.mobileDetails = {
          phoneNumber: accountDetails.phoneNumber,
          provider: selectedMethod.name
        };
      } else if (selectedMethod.type === 'bank_transfer') {
        withdrawalDetails.bankDetails = {
          accountNumber: accountDetails.accountNumber,
          bankName: accountDetails.bankName,
          accountHolderName: accountDetails.accountHolderName,
          swiftCode: accountDetails.swiftCode
        };
      }

      const requestId = await walletService.initiateWithdrawal(
        auth.currentUser.uid,
        withdrawalAmount,
        selectedMethod,
        withdrawalDetails
      );

      toast.success('Withdrawal request submitted! It will be processed within 24 hours.');
      onClose();
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

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'telebirr': return <Smartphone className="w-6 h-6" />;
      case 'cbe_birr': return <CreditCard className="w-6 h-6" />;
      case 'bank_transfer': return <Building className="w-6 h-6" />;
      default: return <CreditCard className="w-6 h-6" />;
    }
  };

  const isDetailsValid = () => {
    if (selectedMethod.type === 'telebirr' || selectedMethod.type === 'cbe_birr') {
      return accountDetails.phoneNumber.length >= 10;
    } else if (selectedMethod.type === 'bank_transfer') {
      return accountDetails.accountNumber && accountDetails.bankName && accountDetails.accountHolderName;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
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

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'method' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'
            }`}>
              1
            </div>
            <div className="w-4 h-0.5 bg-white/20"></div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'amount' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'
            }`}>
              2
            </div>
            <div className="w-4 h-0.5 bg-white/20"></div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'details' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'
            }`}>
              3
            </div>
            <div className="w-4 h-0.5 bg-white/20"></div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'
            }`}>
              4
            </div>
          </div>
        </div>

        {/* Step 1: Payment Method */}
        {step === 'method' && (
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Select Withdrawal Method</h3>
            {WITHDRAWAL_METHODS.filter(method => method.isActive).map((method) => (
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
                      Fee: {method.fees.withdrawal.percentage}% + {formatCurrency(method.fees.withdrawal.fixed)}
                    </p>
                    <p className="text-white/60 text-xs">
                      Limit: {formatCurrency(method.limits.minWithdrawal)} - {formatCurrency(method.limits.maxWithdrawal)}
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
                Withdrawal Amount (ETB)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min={selectedMethod.limits.minWithdrawal}
                max={Math.min(selectedMethod.limits.maxWithdrawal, wallet?.balance || 0)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-white/60 text-xs mt-1">
                Min: {formatCurrency(selectedMethod.limits.minWithdrawal)} - Max: {formatCurrency(Math.min(selectedMethod.limits.maxWithdrawal, wallet?.balance || 0))}
              </p>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-400 font-semibold mb-2">Withdrawal Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-white/80">
                    <span>Withdrawal Amount:</span>
                    <span>{formatCurrency(parseFloat(amount))}</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Processing Fee:</span>
                    <span>{formatCurrency(calculateFee(parseFloat(amount)))}</span>
                  </div>
                  <div className="border-t border-red-500/30 pt-1 mt-2">
                    <div className="flex justify-between text-red-400 font-semibold">
                      <span>You'll Receive:</span>
                      <span>{formatCurrency(calculateNet(parseFloat(amount)))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-yellow-400 text-sm">
                  <p className="font-semibold mb-1">Processing Time:</p>
                  <p>Withdrawals are processed within 24 hours during business days.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('method')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('details')}
                disabled={!amount || parseFloat(amount) < selectedMethod.limits.minWithdrawal}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Account Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Account Details</h3>
            
            {(selectedMethod.type === 'telebirr' || selectedMethod.type === 'cbe_birr') && (
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={accountDetails.phoneNumber}
                  onChange={(e) => setAccountDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+251912345678"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {selectedMethod.type === 'bank_transfer' && (
              <>
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountDetails.accountHolderName}
                    onChange={(e) => setAccountDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    placeholder="Full name as on bank account"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={accountDetails.bankName}
                    onChange={(e) => setAccountDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g., Commercial Bank of Ethiopia"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountDetails.accountNumber}
                    onChange={(e) => setAccountDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Bank account number"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    SWIFT Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={accountDetails.swiftCode}
                    onChange={(e) => setAccountDetails(prev => ({ ...prev, swiftCode: e.target.value }))}
                    placeholder="Bank SWIFT code"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('amount')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!isDetailsValid()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">Confirm Withdrawal</h3>
            
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-white/80">Method:</span>
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
                  <span className="text-white font-semibold">You'll Receive:</span>
                  <span className="text-green-400 font-bold text-lg">{formatCurrency(calculateNet(parseFloat(amount)))}</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div className="text-orange-400 text-sm">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>Please ensure your account details are correct. Incorrect details may result in failed transfers and additional fees.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('details')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Submit Request</span>
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

export default WithdrawalModal;