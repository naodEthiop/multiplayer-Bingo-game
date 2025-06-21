export interface Player {
  id: string;
  name: string;
  email: string;
  telegramId?: string;
  avatar?: string;
  isOnline: boolean;
  // joinedAt: Date;
}

export interface BingoSquare {
  number: number;
  marked: boolean;
  called: boolean;
}

export interface BingoCard {
  id: string;
  playerId: string;
  B: BingoSquare[];
  I: BingoSquare[];
  N: BingoSquare[];
  G: BingoSquare[];
  O: BingoSquare[];
}

export interface GameRoom {

  id: string;
  name: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  entryFee: number;
  prizePool: number;
  status: string;
  calledNumbers: number[];
  currentCall: number | null;
  createdAt: Date | any;
  telegramBotEnabled?: boolean;
  telegramChannelId?: string;
}

export interface Payment {
  id: string;
  playerId: string;
  gameRoomId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  chapaReference: string;
  createdAt: Date;
  completedAt?: Date;
}