import React from 'react';
import { BingoCard as BingoCardType } from '../types/game';

interface BingoCardProps {
  card: BingoCardType;
  calledNumbers: number[];
  onMarkSquare: (column: keyof Omit<BingoCardType, 'id' | 'playerId'>, index: number) => void;
  disabled?: boolean;
}

const BINGO_RANGES = {
  B: { color: 'bg-blue-500' },
  I: { color: 'bg-indigo-500' },
  N: { color: 'bg-emerald-500' },
  G: { color: 'bg-amber-500' },
  O: { color: 'bg-red-500' }
};

const BingoCard: React.FC<BingoCardProps> = ({ card, calledNumbers, onMarkSquare, disabled = false }) => {
  const isNumberCalled = (number: number) => {
    return calledNumbers.includes(number);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      {/* Column Headers */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Object.entries(BINGO_RANGES).map(([letter, range]) => (
          <div key={letter} className={`${range.color} text-white text-center py-3 rounded-lg font-bold text-xl`}>
            {letter}
          </div>
        ))}
      </div>
      
      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, rowIndex) => 
          Object.entries(card).filter(([key]) => key !== 'id' && key !== 'playerId').map(([column, squares], colIndex) => {
            const square = squares[rowIndex];
            if (!square) return null;
            
            const isNumberCalledInGame = isNumberCalled(square.number);
            
            return (
              <button
                key={`${column}-${rowIndex}`}
                onClick={() => !disabled && onMarkSquare(column as keyof Omit<BingoCardType, 'id' | 'playerId'>, rowIndex)}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-lg font-bold
                  transition-all duration-200 transform hover:scale-105 border-2
                  ${square.marked 
                    ? 'bg-green-500 text-white border-green-400 shadow-lg' 
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                  }
                  ${isNumberCalledInGame && !square.marked ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse' : ''}
                  ${square.number === 0 ? 'bg-emerald-500 text-white border-emerald-400' : ''}
                  ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
                disabled={disabled}
              >
                {square.number === 0 ? 'FREE' : square.number}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BingoCard;