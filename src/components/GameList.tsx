import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";

interface Game {
  id: string;
  name?: string;
  [key: string]: any;
}

interface GameListProps {
  onSelectGame: (gameId: string) => void;
  onBack?: () => void;
}

const GameList: React.FC<GameListProps> = ({ onSelectGame, onBack }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      const db = getFirestore();
      const gameRoomsRef = collection(db, "gameRooms");
      const snapshot = await getDocs(gameRoomsRef);
      const gamesList: Game[] = [];
      snapshot.forEach(doc => {
        gamesList.push({ id: doc.id, ...doc.data() });
      });
      setGames(gamesList);
      setLoading(false);
    };

    fetchGames();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-white animate-pulse">
      <span className="text-xl mb-2">Loading games...</span>
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      {onBack && (
        <button
          onClick={onBack}
          className="mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded text-white font-semibold transition-all duration-200"
        >
          Back to Menu
        </button>
      )}
    </div>
  );

  if (games.length < 2) return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-white">
      <span className="text-lg mb-4">Not enough games created yet.</span>
      {onBack && (
        <button
          onClick={onBack}
          className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded text-white font-semibold transition-all duration-200"
        >
          Back to Menu
        </button>
      )}
    </div>
  );

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Select a Game to Play</h2>
      <ul className="space-y-4">
        {games.map(game => (
          <li
            key={game.id}
            className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-lg px-6 py-4 shadow transition-all duration-200"
          >
            <span className="font-semibold">{game.name || `Game ${game.id}`}</span>
            <button
              className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded text-white font-semibold transition-all duration-200"
              onClick={() => onSelectGame(game.id)}
            >
              Play
            </button>
          </li>
        ))}
      </ul>
      {onBack && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded text-white font-semibold transition-all duration-200"
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default GameList;