import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Languages, Mic } from 'lucide-react';
import { voiceService, VoiceSettings as VoiceSettingsType } from '../services/voiceService';
import { languageService, ETHIOPIAN_LANGUAGES } from '../services/languageService';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<VoiceSettingsType>(voiceService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState(languageService.getCurrentLanguage());

  useEffect(() => {
    if (isOpen) {
      setSettings(voiceService.loadSettings());
      setAvailableVoices(voiceService.getAvailableVoices());
      setCurrentLanguage(languageService.getCurrentLanguage());
    }
  }, [isOpen]);

  const handleSettingChange = (key: keyof VoiceSettingsType, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    voiceService.updateSettings(newSettings);
  };

  const handleLanguageChange = (languageCode: string) => {
    languageService.setLanguage(languageCode);
    setCurrentLanguage(languageService.getCurrentLanguage());
    handleSettingChange('language', languageCode);
    
    // Update available voices for the new language
    setAvailableVoices(voiceService.getAvailableVoices(languageCode));
  };

  const testVoice = async () => {
    const testText = currentLanguage.phrases.goodLuck || 'Good luck';
    try {
      await voiceService.speak(testText);
    } catch (error) {
      console.error('Voice test failed:', error);
    }
  };

  const testNumberCall = async () => {
    const testNumber = 25;
    const testLetter = 'N';
    try {
      await voiceService.speakBingoNumber(testNumber, testLetter, currentLanguage);
    } catch (error) {
      console.error('Number call test failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Volume2 className="w-6 h-6" />
            <span>Voice & Language Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Voice Support Check */}
        {!voiceService.isSupported() && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400 text-sm">
              Voice synthesis is not supported in your browser. Please use a modern browser for voice features.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Enable/Disable Voice */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-white font-semibold flex items-center space-x-2">
                {settings.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span>Enable Voice Announcements</span>
              </span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
              />
            </label>
          </div>

          {settings.enabled && (
            <>
              {/* Language Selection */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-3">
                  <Languages className="w-4 h-4 inline mr-2" />
                  Language / ቋንቋ / Afaan
                </label>
                <div className="space-y-2">
                  {ETHIOPIAN_LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        currentLanguage.code === language.code
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white font-semibold">{language.nativeName}</div>
                      <div className="text-white/60 text-sm">{language.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  <Mic className="w-4 h-4 inline mr-2" />
                  Voice
                </label>
                <select
                  value={settings.voice}
                  onChange={(e) => handleSettingChange('voice', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Default Voice</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name} className="bg-gray-800">
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice Speed */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Speech Rate: {settings.rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.rate}
                  onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-white/60 text-xs mt-1">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Voice Pitch */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Pitch: {settings.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.pitch}
                  onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-white/60 text-xs mt-1">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">
                  Volume: {Math.round(settings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-white/60 text-xs mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Test Buttons */}
              <div className="space-y-3">
                <button
                  onClick={testVoice}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Test Voice</span>
                </button>
                
                <button
                  onClick={testNumberCall}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Test Number Call</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;