import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  arrayUnion,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { GameRoom, Player, BingoCard, Payment } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

const BINGO_RANGES = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 }
};

class GameService {
  // Game Room Management
  async createGameRoom(
    hostId: string, 
    roomName: string, 
    maxPlayers: number, 
    entryFee: number,
    telegramBotEnabled: boolean = false,
    telegramChannelId?: string
  ): Promise<string> {
    const gameRoom: Omit<GameRoom, 'id'> = {
      name: roomName,
      hostId,
      players: [],
      maxPlayers,
      entryFee,
      prizePool: 0,
      status: 'waiting',
      calledNumbers: [],
      currentCall: null,
      createdAt: new Date(),
      telegramBotEnabled,
      ...(telegramBotEnabled && telegramChannelId ? { telegramChannelId } : {})
    };

    const docRef = await addDoc(collection(db, 'gameRooms'), {
      ...gameRoom,
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  }

  async joinGameRoom(gameRoomId: string, player: Player): Promise<void> {
    const gameRoomRef = doc(db, 'gameRooms', gameRoomId);
    await updateDoc(gameRoomRef, {
      players: arrayUnion(player),
      prizePool: increment(0) // Will be updated after payment confirmation
    });
  }

  async leaveGameRoom(gameRoomId: string, playerId: string): Promise<void> {
    // Proper player removal should be handled server-side or with a transaction.
    // This is a placeholder and may not work as expected.
    // Consider fetching the document, removing the player from the array, and updating.
  }

  async startGame(gameRoomId: string): Promise<void> {
    const gameRoomRef = doc(db, 'gameRooms', gameRoomId);
    await updateDoc(gameRoomRef, {
      status : 'playing',
    });

    // Start auto-calling numbers after a 5 second countdown
    setTimeout(() => {
      this.startAutoCaller(gameRoomId);
    }, 5000);
  }

  private async startAutoCaller(gameRoomId: string): Promise<void> {
    const interval = setInterval(async () => {
      try {
        const result = await this.callNextNumber(gameRoomId);
        if (result === null) {
          clearInterval(interval); // Stop when all numbers are called
        }
      } catch (error) {
        console.error('Auto-caller error:', error);
        clearInterval(interval);
      }
    }, 5000); // Call every 5 seconds
  }

  async callNextNumber(gameRoomId: string): Promise<number | null> {
    const gameRoomRef = doc(db, 'gameRooms', gameRoomId);
    const gameRoomSnap = await getDoc(gameRoomRef);
    if (!gameRoomSnap.exists()) return null;

    const data = gameRoomSnap.data() as GameRoom;
    const calledNumbers = data.calledNumbers || [];

    // Only pick from numbers not already called
    const availableNumbers = [];
    for (let i = 1; i <= 75; i++) {
      if (!calledNumbers.includes(i)) {
        availableNumbers.push(i);
      }
    }

    if (availableNumbers.length === 0) return null;

    const nextNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];

    await updateDoc(gameRoomRef, {
      calledNumbers: arrayUnion(nextNumber),
      currentCall: nextNumber
    });

    return nextNumber;
  }

  // Bingo Card Generation
  generateBingoCard(playerId: string): BingoCard {
    const card: BingoCard = {
      id: uuidv4(),
      playerId,
      B: [],
      I: [],
      N: [],
      G: [],
      O: []
    };

    Object.entries(BINGO_RANGES).forEach(([letter, range]) => {
      const numbers: number[] = [];
      while (numbers.length < 5) {
        const num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        if (!numbers.includes(num)) {
          numbers.push(num);
        }
      }
      
      card[letter as keyof typeof BINGO_RANGES] = numbers.map((num, index) => ({
        number: letter === 'N' && index === 2 ? 0 : num, // Free space
        marked: letter === 'N' && index === 2, // Free space is pre-marked
        called: false
      }));
    });

    return card;
  }

  // Win Detection
  checkWin(card: BingoCard): { hasWon: boolean; pattern?: string } {
    const columns = Object.keys(card).filter(key => key !== 'id' && key !== 'playerId') as (keyof Omit<BingoCard, 'id' | 'playerId'>)[];
    const grid = columns.map(col => card[col]);
    
    // Check rows
    for (let row = 0; row < 5; row++) {
      if (grid.every(col => col[row].marked)) {
        return { hasWon: true, pattern: 'Row' };
      }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      if (grid[col].every(square => square.marked)) {
        return { hasWon: true, pattern: 'Column' };
      }
    }
    
    // Check diagonals
    if (grid.every((col, index) => col[index].marked)) {
      return { hasWon: true, pattern: 'Diagonal' };
    }
    
    if (grid.every((col, index) => col[4 - index].marked)) {
      return { hasWon: true, pattern: 'Diagonal' };
    }
    
    return { hasWon: false };
  }

  // Real-time subscriptions
  subscribeToGameRoom(gameRoomId: string, callback: (gameRoom: GameRoom) => void) {
    const gameRoomRef = doc(db, 'gameRooms', gameRoomId);
    return onSnapshot(gameRoomRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as GameRoom);
      }
    });
  }

  subscribeToGameRooms(callback: (gameRooms: GameRoom[]) => void) {
    const q = query(
      collection(db, 'gameRooms'),
      where('status', 'in', ['waiting', 'starting', 'playing']),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const gameRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GameRoom[];
      callback(gameRooms);
    });
  }

  // Payment Management
  async recordPayment(payment: Omit<Payment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...payment,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  async updatePaymentStatus(paymentId: string, status: Payment['status']): Promise<void> {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      status,
      completedAt: status === 'completed' ? serverTimestamp() : null
    });
  }

  async updatePrizePool(gameRoomId: string, amount: number): Promise<void> {
    const gameRoomRef = doc(db, 'gameRooms', gameRoomId);
    await updateDoc(gameRoomRef, {
      prizePool: increment(amount)
    });
  }
}

export const gameService = new GameService();