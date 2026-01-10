import axios from 'axios';
import { config } from '../config';

export class WhatsAppService {
  private baseUrl = 'https://graph.facebook.com/v21.0';

  async sendTextMessage(to: string, text: string) {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${config.meta.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }
}