
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata?: {
    gameId?: string;
    paymentMethod?: string;
    chapaReference?: string;
    originalAmount?: number;
  };
  createdAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'telebirr' | 'cbe_birr' | 'bank_transfer';
  name: string;
  details: { 
    provider?: string;
    type?: string;
  };
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
