import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Wallet, Transaction, PaymentMethod, WithdrawalRequest, BettingLimits } from '../types/wallet';
import { v4 as uuidv4 } from 'uuid';

class WalletService {
  // Wallet Management
  async createWallet(userId: string, currency: string = 'ETB'): Promise<string> {
    const wallet: Omit<Wallet, 'id'> = {
      userId,
      balance: 0,
      currency,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'wallets'), wallet);
    return docRef.id;
  }

  async getWallet(userId: string): Promise<Wallet | null> {
    const q = query(
      collection(db, 'wallets'),
      where('userId', '==', userId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Wallet;
  }

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.getWallet(userId);
    if (!wallet) {
      const walletId = await this.createWallet(userId);
      const walletDoc = await getDoc(doc(db, 'wallets', walletId));
      wallet = { id: walletDoc.id, ...walletDoc.data() } as Wallet;
    }
    return wallet;
  }

  // Deposit Functions
  async initiateDeposit(
    userId: string, 
    amount: number, 
    paymentMethod: PaymentMethod,
    metadata?: Record<string, any>
  ): Promise<string> {
    const wallet = await this.getOrCreateWallet(userId);
    
    // Calculate fees
    const fee = this.calculateFee(amount, paymentMethod.fees.deposit);
    const totalAmount = amount + fee;

    const transaction: Omit<Transaction, 'id'> = {
      userId,
      walletId: wallet.id,
      type: 'deposit',
      amount: totalAmount,
      currency: wallet.currency,
      status: 'pending',
      description: `Deposit via ${paymentMethod.name}`,
      reference: `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod,
      createdAt: serverTimestamp(),
      metadata: { ...metadata, originalAmount: amount, fee }
    };

    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    return docRef.id;
  }

  async processDeposit(transactionId: string, externalReference?: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionDoc = await transaction.get(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transactionData = transactionDoc.data() as Transaction;
      
      if (transactionData.status !== 'pending') {
        throw new Error('Transaction already processed');
      }

      const walletRef = doc(db, 'wallets', transactionData.walletId);
      const walletDoc = await transaction.get(walletRef);
      
      if (!walletDoc.exists()) {
        throw new Error('Wallet not found');
      }

      // Update transaction status
      transaction.update(transactionRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        ...(externalReference && { 
          metadata: { 
            ...transactionData.metadata, 
            externalReference 
          }
        })
      });

      // Update wallet balance
      const originalAmount = transactionData.metadata?.originalAmount || transactionData.amount;
      transaction.update(walletRef, {
        balance: increment(originalAmount),
        updatedAt: serverTimestamp()
      });
    });
  }

  // Withdrawal Functions
  async initiateWithdrawal(
    userId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    withdrawalDetails: any
  ): Promise<string> {
    const wallet = await this.getOrCreateWallet(userId);
    
    // Check balance
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Check limits
    await this.checkWithdrawalLimits(userId, amount, paymentMethod);

    // Calculate fees
    const fee = this.calculateFee(amount, paymentMethod.fees.withdrawal);
    const totalDeduction = amount + fee;

    if (wallet.balance < totalDeduction) {
      throw new Error('Insufficient balance including fees');
    }

    const withdrawalRequest: Omit<WithdrawalRequest, 'id'> = {
      userId,
      amount,
      currency: wallet.currency,
      paymentMethod,
      ...withdrawalDetails,
      status: 'pending',
      requestedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'withdrawalRequests'), withdrawalRequest);

    // Create pending transaction
    const transaction: Omit<Transaction, 'id'> = {
      userId,
      walletId: wallet.id,
      type: 'withdrawal',
      amount: totalDeduction,
      currency: wallet.currency,
      status: 'pending',
      description: `Withdrawal via ${paymentMethod.name}`,
      reference: `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      paymentMethod,
      createdAt: serverTimestamp(),
      metadata: { 
        withdrawalRequestId: docRef.id, 
        originalAmount: amount, 
        fee 
      }
    };

    await addDoc(collection(db, 'transactions'), transaction);
    return docRef.id;
  }

  async processWithdrawal(
    withdrawalRequestId: string, 
    status: 'approved' | 'rejected',
    processedBy: string,
    reason?: string
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const withdrawalRef = doc(db, 'withdrawalRequests', withdrawalRequestId);
      const withdrawalDoc = await transaction.get(withdrawalRef);
      
      if (!withdrawalDoc.exists()) {
        throw new Error('Withdrawal request not found');
      }

      const withdrawalData = withdrawalDoc.data() as WithdrawalRequest;

      // Find associated transaction - simplified query
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', withdrawalData.userId),
        where('type', '==', 'withdrawal'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const transactionSnapshot = await getDocs(transactionsQuery);
      const associatedTransaction = transactionSnapshot.docs.find(doc => {
        const data = doc.data() as Transaction;
        return data.metadata?.withdrawalRequestId === withdrawalRequestId;
      });

      if (!associatedTransaction) {
        throw new Error('Associated transaction not found');
      }

      const transactionData = associatedTransaction.data() as Transaction;
      const transactionRef = doc(db, 'transactions', associatedTransaction.id);

      // Update withdrawal request
      transaction.update(withdrawalRef, {
        status,
        processedAt: serverTimestamp(),
        processedBy,
        ...(reason && { reason })
      });

      if (status === 'approved') {
        // Update transaction to processing
        transaction.update(transactionRef, {
          status: 'processing',
          completedAt: serverTimestamp()
        });

        // Deduct from wallet
        const walletRef = doc(db, 'wallets', transactionData.walletId);
        transaction.update(walletRef, {
          balance: increment(-transactionData.amount),
          updatedAt: serverTimestamp()
        });
      } else {
        // Reject transaction
        transaction.update(transactionRef, {
          status: 'failed',
          completedAt: serverTimestamp()
        });
      }
    });
  }

  // Betting Functions
  async placeBet(
    userId: string,
    gameId: string,
    betAmount: number,
    metadata?: Record<string, any>
  ): Promise<string> {
    const wallet = await this.getOrCreateWallet(userId);
    
    // Check balance
    if (wallet.balance < betAmount) {
      throw new Error('Insufficient balance');
    }

    // Check betting limits
    await this.checkBettingLimits(userId, betAmount);

    return await runTransaction(db, async (transaction) => {
      const walletRef = doc(db, 'wallets', wallet.id);
      
      // Create bet transaction
      const betTransaction: Omit<Transaction, 'id'> = {
        userId,
        walletId: wallet.id,
        type: 'bet',
        amount: betAmount,
        currency: wallet.currency,
        status: 'completed',
        description: `Bet placed on game ${gameId}`,
        reference: `BET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        gameId,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        metadata
      };

      const docRef = await addDoc(collection(db, 'transactions'), betTransaction);

      // Deduct from wallet
      transaction.update(walletRef, {
        balance: increment(-betAmount),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    });
  }

  async processWin(
    userId: string,
    gameId: string,
    winAmount: number,
    betTransactionId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const wallet = await this.getOrCreateWallet(userId);

    return await runTransaction(db, async (transaction) => {
      const walletRef = doc(db, 'wallets', wallet.id);
      
      // Create win transaction
      const winTransaction: Omit<Transaction, 'id'> = {
        userId,
        walletId: wallet.id,
        type: 'win',
        amount: winAmount,
        currency: wallet.currency,
        status: 'completed',
        description: `Win from game ${gameId}`,
        reference: `WIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        gameId,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        metadata: { ...metadata, betTransactionId }
      };

      const docRef = await addDoc(collection(db, 'transactions'), winTransaction);

      // Add to wallet
      transaction.update(walletRef, {
        balance: increment(winAmount),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    });
  }

  // Transaction History
  async getTransactionHistory(
    userId: string,
    type?: Transaction['type'],
    limitCount: number = 50
  ): Promise<Transaction[]> {
    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (type) {
      q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  }

  // Utility Functions
  private calculateFee(amount: number, feeStructure: { fixed: number; percentage: number }): number {
    return feeStructure.fixed + (amount * feeStructure.percentage / 100);
  }

  private async checkWithdrawalLimits(
    userId: string, 
    amount: number, 
    paymentMethod: PaymentMethod
  ): Promise<void> {
    // Check method limits
    if (amount < paymentMethod.limits.minWithdrawal) {
      throw new Error(`Minimum withdrawal amount is ${paymentMethod.limits.minWithdrawal}`);
    }
    
    if (amount > paymentMethod.limits.maxWithdrawal) {
      throw new Error(`Maximum withdrawal amount is ${paymentMethod.limits.maxWithdrawal}`);
    }

    // Check daily limits - simplified query
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'withdrawal'),
      where('createdAt', '>=', todayTimestamp),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const dailyTotal = snapshot.docs
      .filter(doc => {
        const data = doc.data() as Transaction;
        return data.status === 'completed' || data.status === 'processing';
      })
      .reduce((total, doc) => {
        const data = doc.data() as Transaction;
        return total + (data.metadata?.originalAmount || data.amount);
      }, 0);

    if (dailyTotal + amount > paymentMethod.limits.dailyLimit) {
      throw new Error(`Daily withdrawal limit exceeded`);
    }
  }

  private async checkBettingLimits(userId: string, betAmount: number): Promise<void> {
    // Get user betting limits
    const limitsQuery = query(
      collection(db, 'bettingLimits'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(limitsQuery);
    if (snapshot.empty) return; // No limits set

    const limits = snapshot.docs[0].data() as BettingLimits;

    // Check self-exclusion
    if (limits.selfExclusionUntil && new Date() < limits.selfExclusionUntil.toDate()) {
      throw new Error('Account is under self-exclusion');
    }

    // Check max bet amount
    if (betAmount > limits.maxBetAmount) {
      throw new Error(`Maximum bet amount is ${limits.maxBetAmount}`);
    }

    // Check daily limit - simplified query
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);
    
    const dailyBetsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'bet'),
      where('createdAt', '>=', todayTimestamp),
      limit(50)
    );

    const dailySnapshot = await getDocs(dailyBetsQuery);
    const dailyTotal = dailySnapshot.docs.reduce((total, doc) => {
      return total + (doc.data() as Transaction).amount;
    }, 0);

    if (dailyTotal + betAmount > limits.dailyLimit) {
      throw new Error('Daily betting limit exceeded');
    }
  }

  // Real-time subscriptions
  subscribeToWallet(userId: string, callback: (wallet: Wallet | null) => void) {
    const q = query(
      collection(db, 'wallets'),
      where('userId', '==', userId),
      limit(1)
    );
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const doc = snapshot.docs[0];
        callback({ id: doc.id, ...doc.data() } as Wallet);
      }
    });
  }

  subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      callback(transactions);
    });
  }
}

export const walletService = new WalletService();