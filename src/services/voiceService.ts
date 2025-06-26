export interface VoiceSettings {
  enabled: boolean;
  language: string;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  numbers: { [key: number]: string };
  letters: { [key: string]: string };
  phrases: { [key: string]: string };
}

class VoiceService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private settings: VoiceSettings = {
    enabled: true,
    language: 'am-ET', // Amharic
    voice: '',
    rate: 0.8,
    pitch: 1,
    volume: 1
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synthesis.getVoices();
  }

  getAvailableVoices(languageCode?: string): SpeechSynthesisVoice[] {
    if (languageCode) {
      return this.voices.filter(voice => voice.lang.startsWith(languageCode));
    }
    return this.voices;
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('voiceSettings', JSON.stringify(this.settings));
  }

  loadSettings(): VoiceSettings {
    const saved = localStorage.getItem('voiceSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
    return this.settings;
  }

  speak(text: string, options?: Partial<VoiceSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.settings.enabled) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const settings = { ...this.settings, ...options };

      // Find the best voice for the language
      const availableVoices = this.getAvailableVoices(settings.language);
      if (availableVoices.length > 0) {
        utterance.voice = availableVoices.find(v => v.name === settings.voice) || availableVoices[0];
      }

      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      utterance.lang = settings.language;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis.speak(utterance);
    });
  }

  stop(): void {
    this.synthesis.cancel();
  }

  pause(): void {
    this.synthesis.pause();
  }

  resume(): void {
    this.synthesis.resume();
  }

  async speakBingoNumber(number: number, letter: string, languageConfig: LanguageConfig): Promise<void> {
    const numberText = languageConfig.numbers[number] || number.toString();
    const letterText = languageConfig.letters[letter] || letter;
    
    let announcement: string;
    
    if (languageConfig.code === 'am-ET') {
      // Amharic format
      announcement = `${letterText} ${numberText}`;
    } else if (languageConfig.code === 'om-ET') {
      // Oromo format
      announcement = `${letterText} ${numberText}`;
    } else if (languageConfig.code === 'ti-ET') {
      // Tigrinya format
      announcement = `${letterText} ${numberText}`;
    } else {
      // English format
      announcement = `${letter} ${number}`;
    }

    await this.speak(announcement);
  }

  async speakGameEvent(eventKey: string, languageConfig: LanguageConfig, params?: Record<string, any>): Promise<void> {
    let text = languageConfig.phrases[eventKey] || eventKey;
    
    // Replace parameters in the text
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, value.toString());
      });
    }

    await this.speak(text);
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }
}

export const voiceService = new VoiceService();