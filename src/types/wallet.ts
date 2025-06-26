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
  userId: string;
  type: 'bank' | 'mobile_money' | 'card';
  name: string;
  details: {
    accountNumber?: string;
    bankName?: string;
    phoneNumber?: string;
    cardLast4?: string;
  };
  isDefault: boolean;
  createdAt: Date;
}