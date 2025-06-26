import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Wallet, Transaction, PaymentMethod } from '../types/wallet';

class WalletService {
  // Create or get wallet for user
  async createWallet(userId: string): Promise<Wallet> {
    const walletRef = doc(db, 'wallets', userId);
    const walletSnap = await getDoc(walletRef);

    if (walletSnap.exists()) {
      return { id: walletSnap.id, ...walletSnap.data() } as Wallet;
    }

    const newWallet: Omit<Wallet, 'id'> = {
      userId,
      balance: 0,
      currency: 'ETB',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(walletRef, newWallet);
    return { id: userId, ...newWallet };
  }

  // Get wallet by user ID
  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        return { id: walletSnap.id, ...walletSnap.data() } as Wallet;
      }

      // Create wallet if it doesn't exist
      return await this.createWallet(userId);
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  // Subscribe to wallet changes
  subscribeToWallet(userId: string, callback: (wallet: Wallet | null) => void): () => void {
    try {
      const walletRef = doc(db, 'wallets', userId);

      return onSnapshot(walletRef, (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as Wallet);
        } else {
          // Create wallet if it doesn't exist
          this.createWallet(userId).then(callback).catch(() => callback(null));
        }
      }, (error) => {
        console.error('Failed to subscribe to wallet:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Failed to subscribe to wallet:', error);
      return () => {};
    }
  }

  // Subscribe to transactions
  subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void): () => void {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        callback(transactions);
      }, (error) => {
        console.error('Failed to subscribe to transactions:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Failed to subscribe to transactions:', error);
      return () => {};
    }
  }

  // Update wallet balance
  async updateBalance(userId: string, amount: number, operation: 'add' | 'subtract' = 'add'): Promise<boolean> {
    try {
      const walletRef = doc(db, 'wallets', userId);

      return await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);

        if (!walletDoc.exists()) {
          throw new Error('Wallet does not exist');
        }

        const currentBalance = walletDoc.data().balance || 0;
        const newBalance = operation === 'add' 
          ? currentBalance + amount 
          : currentBalance - amount;

        if (newBalance < 0) {
          throw new Error('Insufficient balance');
        }

        transaction.update(walletRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });

        return true;
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      return false;
    }
  }

  // Create transaction record
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const transactionData = {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'transactions'), transactionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  // Process deposit
  async processDeposit(userId: string, amount: number, paymentMethod: string, metadata?: any): Promise<boolean> {
    try {
      // Create transaction record
      const transactionId = await this.createTransaction({
        userId,
        type: 'deposit',
        amount,
        status: 'pending',
        paymentMethod,
        description: `Deposit via ${paymentMethod}`,
        metadata
      });

      if (!transactionId) {
        throw new Error('Failed to create transaction record');
      }

      // Update wallet balance
      const success = await this.updateBalance(userId, amount, 'add');

      if (success) {
        // Update transaction status
        await updateDoc(doc(db, 'transactions', transactionId), {
          status: 'completed',
          updatedAt: serverTimestamp()
        });
      } else {
        // Update transaction status to failed
        await updateDoc(doc(db, 'transactions', transactionId), {
          status: 'failed',
          updatedAt: serverTimestamp()
        });
      }

      return success;
    } catch (error) {
      console.error('Error processing deposit:', error);
      return false;
    }
  }

  // Process withdrawal
  async processWithdrawal(userId: string, amount: number, paymentMethod: string, metadata?: any): Promise<boolean> {
    try {
      // Check if user has sufficient balance
      const wallet = await this.getWallet(userId);
      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transaction record
      const transactionId = await this.createTransaction({
        userId,
        type: 'withdrawal',
        amount,
        status: 'pending',
        paymentMethod,
        description: `Withdrawal via ${paymentMethod}`,
        metadata
      });

      if (!transactionId) {
        throw new Error('Failed to create transaction record');
      }

      // Update wallet balance
      const success = await this.updateBalance(userId, amount, 'subtract');

      if (success) {
        // Update transaction status
        await updateDoc(doc(db, 'transactions', transactionId), {
          status: 'completed',
          updatedAt: serverTimestamp()
        });
      } else {
        // Update transaction status to failed
        await updateDoc(doc(db, 'transactions', transactionId), {
          status: 'failed',
          updatedAt: serverTimestamp()
        });
      }

      return success;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return false;
    }
  }

  // Get transaction history
  async getTransactionHistory(userId: string, limitCount: number = 20): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }
}

export const walletService = new WalletService();