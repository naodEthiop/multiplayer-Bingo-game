import axios from 'axios';

const CHAPA_SECRET_KEY = import.meta.env.VITE_CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

export interface ChapaPaymentRequest {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization: {
    title: string;
    description: string;
  };
}

export interface ChapaPaymentResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

class ChapaService {
  private headers = {
    'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };

  async initializePayment(paymentData: ChapaPaymentRequest): Promise<ChapaPaymentResponse> {
    try {
      const response = await axios.post(
        `${CHAPA_BASE_URL}/transaction/initialize`,
        paymentData,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Chapa payment initialization failed:', error);
      throw new Error('Payment initialization failed');
    }
  }

  async verifyPayment(txRef: string): Promise<any> {
    try {
      const response = await axios.get(
        `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Chapa payment verification failed:', error);
      throw new Error('Payment verification failed');
    }
  }

  generateTxRef(): string {
    return `bingo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const chapaService = new ChapaService();