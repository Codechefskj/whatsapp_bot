import axios from 'axios';
import { config } from '../config.js';

export class WhatsAppService {
  private baseUrl = 'https://graph.facebook.com/v21.0';

  async sendTextMessage(to: string, text: string) {
    const response = await axios.post(
      `${this.baseUrl}/${config.meta.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${config.meta.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async markAsRead(messageId: string) {
    await axios.post(
      `${this.baseUrl}/${config.meta.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      },
      {
        headers: {
          Authorization: `Bearer ${config.meta.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}