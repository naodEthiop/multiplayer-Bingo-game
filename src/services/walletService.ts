import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Transaction } from '../types/wallet';

const API_BASE_URL = 'https://28f0eda4-60c8-4ddb-a036-763cb8fd46c0-00-2bbc1x56d1sdx.worf.replit.dev:5000/api';

interface PaymentData {
  amount: number;
  email: string;
  first_name: string;
  last_name: string;
  userId: string;
}

class WalletService {
  async deposit(amount: number, userId: string, userEmail: string = '', firstName: string = '', lastName: string = ''): Promise<string> {
    try {
      const paymentData: PaymentData = {
        amount,
        email: userEmail || `user-${userId}@bingo.com`,
        first_name: firstName || 'Bingo',
        last_name: lastName || 'User',
        userId
      };

      const response = await fetch(`${API_BASE_URL}/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Record pending transaction
      await this.recordTransaction({
        userId,
        type: 'deposit',
        amount,
        status: 'pending',
        provider: 'chapa',
        txRef: data.tx_ref,
        createdAt: serverTimestamp()
      });

      return data.checkout_url;
    } catch (error) {
      console.error('Deposit error:', error);
      throw error;
    }
  }

  async withdraw(amount: number, userId: string, accountNumber: string, bankName: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
          accountNumber,
          bankName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      // Record withdrawal transaction
      await this.recordTransaction({
        userId,
        type: 'withdrawal',
        amount: -amount,
        status: 'processing',
        provider: 'bank_transfer',
        txRef: data.transactionId,
        createdAt: serverTimestamp(),
        metadata: {
          accountNumber,
          bankName
        }
      });

    } catch (error) {
      console.error('Withdrawal error:', error);
      throw error;
    }
  }

  async verifyPayment(txRef: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-payment/${txRef}`);
      const data = await response.json();

      return data.status === 'success';
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  private async recordTransaction(transaction: Omit<Transaction, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'transactions'), transaction);
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
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