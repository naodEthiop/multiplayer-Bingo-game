import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameRoom, Player, BingoCard } from '../types/game';

interface GameState {
  currentGame: GameRoom | null;
  playerCard: BingoCard | null;
  isHost: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

type GameAction =
  | { type: 'SET_CURRENT_GAME'; payload: GameRoom }
  | { type: 'SET_PLAYER_CARD'; payload: BingoCard }
  | { type: 'SET_HOST_STATUS'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'disconnected' | 'connecting' }
  | { type: 'UPDATE_GAME_STATE'; payload: Partial<GameRoom> }
  | { type: 'CLEAR_GAME' };

const initialState: GameState = {
  currentGame: null,
  playerCard: null,
  isHost: false,
  connectionStatus: 'disconnected'
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_CURRENT_GAME':
      return { ...state, currentGame: action.payload };
    case 'SET_PLAYER_CARD':
      return { ...state, playerCard: action.payload };
    case 'SET_HOST_STATUS':
      return { ...state, isHost: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        currentGame: state.currentGame ? { ...state.currentGame, ...action.payload } : null
      };
    case 'CLEAR_GAME':
      return initialState;
    default:
      return state;
  }
};

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};