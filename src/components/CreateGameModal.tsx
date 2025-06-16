import React, { useState } from 'react';
import { X, Users, DollarSign, Trophy, MessageCircle } from 'lucide-react';
import { auth } from '../firebase/config';
import { gameService } from '../services/gameService';
import toast from 'react-hot-toast';

interface CreateGameModalProps {
  onClose: () => void;
  onGameCreated: (gameId: string) => void;
}

const CreateGameModal: React.FC<CreateGameModalProps> = ({ onClose, onGameCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 10,
    entryFee: 0,
    telegramBotEnabled: false,
    telegramChannelId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const gameId = await gameService.createGameRoom(
        auth.currentUser.uid,
        formData.name,
        formData.maxPlayers,
        formData.entryFee,
        formData.telegramBotEnabled,
        formData.telegramChannelId || undefined
      );

      toast.success('Game created successfully!');
      onGameCreated(gameId);
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Create New Game</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Name */}
          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2">
              Game Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter game name"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Maximum Players
            </label>
            <input
              type="number"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleInputChange}
              min="2"
              max="50"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Entry Fee */}
          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Entry Fee (ETB)
            </label>
            <input
              type="number"
              name="entryFee"
              value={formData.entryFee}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-white/60 text-xs mt-1">Set to 0 for free games</p>
          </div>

          {/* Telegram Integration */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="telegramBotEnabled"
                checked={formData.telegramBotEnabled}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-white/80 font-semibold">
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Enable Telegram Bot
              </span>
            </label>
          </div>

          {/* Telegram Channel ID */}
          {formData.telegramBotEnabled && (
            <div>
              <label className="block text-white/80 text-sm font-semibold mb-2">
                Telegram Channel ID
              </label>
              <input
                type="text"
                name="telegramChannelId"
                value={formData.telegramChannelId}
                onChange={handleInputChange}
                placeholder="@your_channel or -100123456789"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-white/60 text-xs mt-1">
                Channel where game updates will be posted
              </p>
            </div>
          )}

          {/* Prize Pool Preview */}
          {formData.entryFee > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">Estimated Prize Pool</span>
              </div>
              <p className="text-white text-lg font-bold">
                {new Intl.NumberFormat('en-ET', {
                  style: 'currency',
                  currency: 'ETB'
                }).format(formData.entryFee * formData.maxPlayers)}
              </p>
              <p className="text-white/60 text-xs">
                Based on maximum players × entry fee
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default CreateGameModal;