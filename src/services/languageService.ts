import { LanguageConfig } from './voiceService';

export const ETHIOPIAN_LANGUAGES: LanguageConfig[] = [
  {
    code: 'am-ET',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    numbers: {
      1: 'አንድ', 2: 'ሁለት', 3: 'ሶስት', 4: 'አራት', 5: 'አምስት',
      6: 'ስድስት', 7: 'ሰባት', 8: 'ስምንት', 9: 'ዘጠኝ', 10: 'አስር',
      11: 'አስራ አንድ', 12: 'አስራ ሁለት', 13: 'አስራ ሶስት', 14: 'አስራ አራት', 15: 'አስራ አምስት',
      16: 'አስራ ስድስት', 17: 'አስራ ሰባት', 18: 'አስራ ስምንት', 19: 'አስራ ዘጠኝ', 20: 'ሃያ',
      21: 'ሃያ አንድ', 22: 'ሃያ ሁለት', 23: 'ሃያ ሶስት', 24: 'ሃያ አራት', 25: 'ሃያ አምስት',
      26: 'ሃያ ስድስት', 27: 'ሃያ ሰባት', 28: 'ሃያ ስምንት', 29: 'ሃያ ዘጠኝ', 30: 'ሰላሳ',
      31: 'ሰላሳ አንድ', 32: 'ሰላሳ ሁለት', 33: 'ሰላሳ ሶስት', 34: 'ሰላሳ አራት', 35: 'ሰላሳ አምስት',
      36: 'ሰላሳ ስድስት', 37: 'ሰላሳ ሰባት', 38: 'ሰላሳ ስምንት', 39: 'ሰላሳ ዘጠኝ', 40: 'አርባ',
      41: 'አርባ አንድ', 42: 'አርባ ሁለት', 43: 'አርባ ሶስት', 44: 'አርባ አራት', 45: 'አርባ አምስት',
      46: 'አርባ ስድስት', 47: 'አርባ ሰባት', 48: 'አርባ ስምንት', 49: 'አርባ ዘጠኝ', 50: 'ሃምሳ',
      51: 'ሃምሳ አንድ', 52: 'ሃምሳ ሁለት', 53: 'ሃምሳ ሶስት', 54: 'ሃምሳ አራት', 55: 'ሃምሳ አምስት',
      56: 'ሃምሳ ስድስት', 57: 'ሃምሳ ሰባት', 58: 'ሃምሳ ስምንት', 59: 'ሃምሳ ዘጠኝ', 60: 'ስድሳ',
      61: 'ስድሳ አንድ', 62: 'ስድሳ ሁለት', 63: 'ስድሳ ሶስት', 64: 'ስድሳ አራት', 65: 'ስድሳ አምስት',
      66: 'ስድሳ ስድስት', 67: 'ስድሳ ሰባት', 68: 'ስድሳ ስምንት', 69: 'ስድሳ ዘጠኝ', 70: 'ሰባ',
      71: 'ሰባ አንድ', 72: 'ሰባ ሁለት', 73: 'ሰባ ሶስት', 74: 'ሰባ አራት', 75: 'ሰባ አምስት'
    },
    letters: {
      B: 'ቢ', I: 'አይ', N: 'ኤን', G: 'ጂ', O: 'ኦ'
    },
    phrases: {
      gameStarting: 'ጨዋታው እየጀመረ ነው',
      numberCalled: 'ቁጥር ተጠርቷል',
      bingo: 'ቢንጎ!',
      winner: 'አሸናፊ!',
      gameOver: 'ጨዋታው ተጠናቋል',
      nextNumber: 'ቀጣዩ ቁጥር',
      goodLuck: 'መልካም እድል',
      congratulations: 'እንኳን ደስ አለዎት',
      waitingForPlayers: 'ተጫዋቾችን እየጠበቅን ነው',
      gameStarted: 'ጨዋታው ጀምሯል',
      markYourCards: 'ካርዶቻችሁን ምልክት አድርጉ'
    }
  },
  {
    code: 'om-ET',
    name: 'Oromo',
    nativeName: 'Afaan Oromoo',
    numbers: {
      1: 'tokko', 2: 'lama', 3: 'sadii', 4: 'afur', 5: 'shan',
      6: 'ja\'a', 7: 'torba', 8: 'saddeet', 9: 'sagal', 10: 'kudhan',
      11: 'kudha tokko', 12: 'kudha lama', 13: 'kudha sadii', 14: 'kudha afur', 15: 'kudha shan',
      16: 'kudha ja\'a', 17: 'kudha torba', 18: 'kudha saddeet', 19: 'kudha sagal', 20: 'digdama',
      21: 'digdama tokko', 22: 'digdama lama', 23: 'digdama sadii', 24: 'digdama afur', 25: 'digdama shan',
      26: 'digdama ja\'a', 27: 'digdama torba', 28: 'digdama saddeet', 29: 'digdama sagal', 30: 'soddoma',
      31: 'soddoma tokko', 32: 'soddoma lama', 33: 'soddoma sadii', 34: 'soddoma afur', 35: 'soddoma shan',
      36: 'soddoma ja\'a', 37: 'soddoma torba', 38: 'soddoma saddeet', 39: 'soddoma sagal', 40: 'afurtama',
      41: 'afurtama tokko', 42: 'afurtama lama', 43: 'afurtama sadii', 44: 'afurtama afur', 45: 'afurtama shan',
      46: 'afurtama ja\'a', 47: 'afurtama torba', 48: 'afurtama saddeet', 49: 'afurtama sagal', 50: 'shantama',
      51: 'shantama tokko', 52: 'shantama lama', 53: 'shantama sadii', 54: 'shantama afur', 55: 'shantama shan',
      56: 'shantama ja\'a', 57: 'shantama torba', 58: 'shantama saddeet', 59: 'shantama sagal', 60: 'jaatama',
      61: 'jaatama tokko', 62: 'jaatama lama', 63: 'jaatama sadii', 64: 'jaatama afur', 65: 'jaatama shan',
      66: 'jaatama ja\'a', 67: 'jaatama torba', 68: 'jaatama saddeet', 69: 'jaatama sagal', 70: 'torbatama',
      71: 'torbatama tokko', 72: 'torbatama lama', 73: 'torbatama sadii', 74: 'torbatama afur', 75: 'torbatama shan'
    },
    letters: {
      B: 'Bii', I: 'Ayii', N: 'Een', G: 'Jii', O: 'Oo'
    },
    phrases: {
      gameStarting: 'Taphi jalqabaa jira',
      numberCalled: 'Lakkoofsi waamamee jira',
      bingo: 'Bingo!',
      winner: 'Injifataa!',
      gameOver: 'Taphi xumurameera',
      nextNumber: 'Lakkoofsa itti aanu',
      goodLuck: 'Carraa gaarii',
      congratulations: 'Baga gammadde',
      waitingForPlayers: 'Taphattoota eegaa jirra',
      gameStarted: 'Taphi jalqabeera',
      markYourCards: 'Kaardii keessan mallattoo godhadhaa'
    }
  },
  {
    code: 'ti-ET',
    name: 'Tigrinya',
    nativeName: 'ትግርኛ',
    numbers: {
      1: 'ሓደ', 2: 'ክልተ', 3: 'ሰለስተ', 4: 'ኣርባዕተ', 5: 'ሓሙሽተ',
      6: 'ሽድሽተ', 7: 'ሸውዓተ', 8: 'ሸሞንተ', 9: 'ትሽዓተ', 10: 'ዓሰርተ',
      11: 'ዓሰርተ ሓደ', 12: 'ዓሰርተ ክልተ', 13: 'ዓሰርተ ሰለስተ', 14: 'ዓሰርተ ኣርባዕተ', 15: 'ዓሰርተ ሓሙሽተ',
      16: 'ዓሰርተ ሽድሽተ', 17: 'ዓሰርተ ሸውዓተ', 18: 'ዓሰርተ ሸሞንተ', 19: 'ዓሰርተ ትሽዓተ', 20: 'ዕስራ',
      21: 'ዕስራ ሓደ', 22: 'ዕስራ ክልተ', 23: 'ዕስራ ሰለስተ', 24: 'ዕስራ ኣርባዕተ', 25: 'ዕስራ ሓሙሽተ',
      26: 'ዕስራ ሽድሽተ', 27: 'ዕስራ ሸውዓተ', 28: 'ዕስራ ሸሞንተ', 29: 'ዕስራ ትሽዓተ', 30: 'ሰላሳ',
      31: 'ሰላሳ ሓደ', 32: 'ሰላሳ ክልተ', 33: 'ሰላሳ ሰለስተ', 34: 'ሰላሳ ኣርባዕተ', 35: 'ሰላሳ ሓሙሽተ',
      36: 'ሰላሳ ሽድሽተ', 37: 'ሰላሳ ሸውዓተ', 38: 'ሰላሳ ሸሞንተ', 39: 'ሰላሳ ትሽዓተ', 40: 'ኣርብዓ',
      41: 'ኣርብዓ ሓደ', 42: 'ኣርብዓ ክልተ', 43: 'ኣርብዓ ሰለስተ', 44: 'ኣርብዓ ኣርባዕተ', 45: 'ኣርብዓ ሓሙሽተ',
      46: 'ኣርብዓ ሽድሽተ', 47: 'ኣርብዓ ሸውዓተ', 48: 'ኣርብዓ ሸሞንተ', 49: 'ኣርብዓ ትሽዓተ', 50: 'ሓምሳ',
      51: 'ሓምሳ ሓደ', 52: 'ሓምሳ ክልተ', 53: 'ሓምሳ ሰለስተ', 54: 'ሓምሳ ኣርባዕተ', 55: 'ሓምሳ ሓሙሽተ',
      56: 'ሓምሳ ሽድሽተ', 57: 'ሓምሳ ሸውዓተ', 58: 'ሓምሳ ሸሞንተ', 59: 'ሓምሳ ትሽዓተ', 60: 'ሱሳ',
      61: 'ሱሳ ሓደ', 62: 'ሱሳ ክልተ', 63: 'ሱሳ ሰለስተ', 64: 'ሱሳ ኣርባዕተ', 65: 'ሱሳ ሓሙሽተ',
      66: 'ሱሳ ሽድሽተ', 67: 'ሱሳ ሸውዓተ', 68: 'ሱሳ ሸሞንተ', 69: 'ሱሳ ትሽዓተ', 70: 'ሰብዓ',
      71: 'ሰብዓ ሓደ', 72: 'ሰብዓ ክልተ', 73: 'ሰብዓ ሰለስተ', 74: 'ሰብዓ ኣርባዕተ', 75: 'ሰብዓ ሓሙሽተ'
    },
    letters: {
      B: 'ቢ', I: 'ኢ', N: 'ኤን', G: 'ጂ', O: 'ኦ'
    },
    phrases: {
      gameStarting: 'ጸወታ ይጅምር ኣሎ',
      numberCalled: 'ቁጽሪ ተጸዊዑ',
      bingo: 'ቢንጎ!',
      winner: 'ዓወተኛ!',
      gameOver: 'ጸወታ ተወዲኡ',
      nextNumber: 'ዝቕጽል ቁጽሪ',
      goodLuck: 'ጽቡቕ ዕድል',
      congratulations: 'እንቋዕ ሓጎሰኩም',
      waitingForPlayers: 'ተጻወትቲ ንጽበ ኣለና',
      gameStarted: 'ጸወታ ጀሚሩ',
      markYourCards: 'ካርድኩም ምልክት ግበሩ'
    }
  },
  {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    numbers: {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
      6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
      11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
      16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
      21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
      26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
      31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
      36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty',
      41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
      46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
      51: 'fifty-one', 52: 'fifty-two', 53: 'fifty-three', 54: 'fifty-four', 55: 'fifty-five',
      56: 'fifty-six', 57: 'fifty-seven', 58: 'fifty-eight', 59: 'fifty-nine', 60: 'sixty',
      61: 'sixty-one', 62: 'sixty-two', 63: 'sixty-three', 64: 'sixty-four', 65: 'sixty-five',
      66: 'sixty-six', 67: 'sixty-seven', 68: 'sixty-eight', 69: 'sixty-nine', 70: 'seventy',
      71: 'seventy-one', 72: 'seventy-two', 73: 'seventy-three', 74: 'seventy-four', 75: 'seventy-five'
    },
    letters: {
      B: 'B', I: 'I', N: 'N', G: 'G', O: 'O'
    },
    phrases: {
      gameStarting: 'Game is starting',
      numberCalled: 'Number called',
      bingo: 'Bingo!',
      winner: 'Winner!',
      gameOver: 'Game over',
      nextNumber: 'Next number',
      goodLuck: 'Good luck',
      congratulations: 'Congratulations',
      waitingForPlayers: 'Waiting for players',
      gameStarted: 'Game started',
      markYourCards: 'Mark your cards'
    }
  }
];

class LanguageService {
  private currentLanguage: LanguageConfig;

  constructor() {
    this.currentLanguage = this.getStoredLanguage() || ETHIOPIAN_LANGUAGES[0];
  }

  getCurrentLanguage(): LanguageConfig {
    return this.currentLanguage;
  }

  setLanguage(languageCode: string): void {
    const language = ETHIOPIAN_LANGUAGES.find(lang => lang.code === languageCode);
    if (language) {
      this.currentLanguage = language;
      localStorage.setItem('selectedLanguage', languageCode);
    }
  }

  getAvailableLanguages(): LanguageConfig[] {
    return ETHIOPIAN_LANGUAGES;
  }

  private getStoredLanguage(): LanguageConfig | null {
    const stored = localStorage.getItem('selectedLanguage');
    if (stored) {
      return ETHIOPIAN_LANGUAGES.find(lang => lang.code === stored) || null;
    }
    return null;
  }

  translate(key: string, params?: Record<string, any>): string {
    let text = this.currentLanguage.phrases[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, value.toString());
      });
    }
    
    return text;
  }

  getNumberText(number: number): string {
    return this.currentLanguage.numbers[number] || number.toString();
  }

  getLetterText(letter: string): string {
    return this.currentLanguage.letters[letter] || letter;
  }
}

export const languageService = new LanguageService();