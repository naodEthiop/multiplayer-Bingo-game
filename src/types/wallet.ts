export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'frozen';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'bonus' | 'fee';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  paymentMethod?: PaymentMethod;
  gameId?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: 'telebirr' | 'cbe_birr' | 'bank_transfer' | 'mobile_money' | 'crypto';
  name: string;
  details: Record<string, any>;
  isActive: boolean;
  fees: {
    deposit: { fixed: number; percentage: number };
    withdrawal: { fixed: number; percentage: number };
  };
  limits: {
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
    maxWithdrawal: number;
    dailyLimit: number;
  };
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
    swiftCode?: string;
  };
  mobileDetails?: {
    phoneNumber: string;
    provider: string;
  };
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export interface BettingLimits {
  userId: string;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  maxBetAmount: number;
  isActive: boolean;
  selfExclusionUntil?: Date;
}