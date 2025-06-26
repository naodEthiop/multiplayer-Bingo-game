
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Wallet, Transaction } from '../types/wallet';

export const walletService = {
  // Subscribe to wallet changes
  subscribeToWallet: (userId: string, callback: (wallet: Wallet | null) => void) => {
    const walletRef = doc(db, 'wallets', userId);

    return onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const walletData = { id: docSnap.id, ...docSnap.data() } as Wallet;
        callback(walletData);
      } else {
        // Create wallet if it doesn't exist
        const newWallet: Omit<Wallet, 'id'> = {
          userId,
          balance: 0,
          currency: 'ETB',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setDoc(walletRef, newWallet).then(() => {
          callback({ id: userId, ...newWallet });
        }).catch((error) => {
          console.error('Failed to create wallet:', error);
          callback(null);
        });
      }
    }, (error) => {
      console.error('Failed to subscribe to wallet:', error);
      callback(null);
    });
  },

  // Subscribe to transactions
  subscribeToTransactions: (userId: string, callback: (transactions: Transaction[]) => void) => {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Transaction[];
      callback(transactions);
    }, (error) => {
      console.error('Failed to subscribe to transactions:', error);
      callback([]);
    });
  },

  // Add transaction
  addTransaction: async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Failed to add transaction:', error);
      return { success: false, error };
    }
  },

  // Update wallet balance
  updateBalance: async (userId: string, newBalance: number) => {
    try {
      const walletRef = doc(db, 'wallets', userId);
      await updateDoc(walletRef, {
        balance: newBalance,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to update balance:', error);
      return { success: false, error };
    }
  },

  // Get wallet balance
  getWallet: async (userId: string): Promise<Wallet | null> => {
    try {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        return { id: walletSnap.id, ...walletSnap.data() } as Wallet;
      }
      return null;
    } catch (error) {
      console.error('Failed to get wallet:', error);
      return null;
    }
  }
};
