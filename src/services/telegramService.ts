import axios from 'axios';

export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

export interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{
    text: string;
    callback_data?: string;
    url?: string;
  }>>;
}

class TelegramService {
  private botToken: string;

  constructor() {
    this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
  }

  private getApiUrl(method: string): string {
    return `https://api.telegram.org/bot${this.botToken}/${method}`;
  }

  async sendMessage(
    chatId: string, 
    text: string, 
    replyMarkup?: TelegramInlineKeyboard
  ): Promise<void> {
    try {
      const payload: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      };

      if (replyMarkup) {
        payload.reply_markup = replyMarkup;
      }

      await axios.post(this.getApiUrl('sendMessage'), payload);
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error;
    }
  }

  async sendGameStartNotification(
    channelId: string, 
    gameRoom: any
  ): Promise<void> {
    const message = `
🎯 <b>BINGO GAME STARTED!</b>

🏆 Game: ${gameRoom.name}
💰 Prize Pool: ${gameRoom.prizePool} ETB
👥 Players: ${gameRoom.players.length}/${gameRoom.maxPlayers}

The game has begun! Good luck to all players! 🍀
    `;

    await this.sendMessage(channelId, message);
  }

  async sendNumberCall(
    channelId: string, 
    number: number, 
    letter: string
  ): Promise<void> {
    const message = `
📢 <b>NUMBER CALLED!</b>

🔢 <b>${letter}-${number}</b>

Mark your cards! 🎯
    `;

    await this.sendMessage(channelId, message);
  }

  async sendWinnerAnnouncement(
    channelId: string, 
    winner: any, 
    gameRoom: any,
    pattern: string
  ): Promise<void> {
    const message = `
🎉 <b>BINGO WINNER!</b>

🏆 Winner: ${winner.name}
🎯 Pattern: ${pattern}
💰 Prize: ${gameRoom.prizePool} ETB
🎮 Game: ${gameRoom.name}

Congratulations! 🎊🎊🎊
    `;

    await this.sendMessage(channelId, message);
  }

  async sendGameInvite(
    channelId: string, 
    gameRoom: any, 
    joinUrl: string
  ): Promise<void> {
    const message = `
🎯 <b>NEW BINGO GAME!</b>

🏆 Game: ${gameRoom.name}
💰 Entry Fee: ${gameRoom.entryFee} ETB
👥 Players: ${gameRoom.players.length}/${gameRoom.maxPlayers}

Join now and win big! 🍀
    `;

    const keyboard: TelegramInlineKeyboard = {
      inline_keyboard: [[
        {
          text: '🎮 Join Game',
          url: joinUrl
        }
      ]]
    };

    await this.sendMessage(channelId, message, keyboard);
  }

  getLetterForNumber(number: number): string {
    if (number <= 15) return 'B';
    if (number <= 30) return 'I';
    if (number <= 45) return 'N';
    if (number <= 60) return 'G';
    return 'O';
  }
}

export const telegramService = new TelegramService();