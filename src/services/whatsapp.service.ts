import axios, { AxiosError } from 'axios';
import { config } from '../config';

interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export class WhatsAppService {
  private baseUrl = 'https://graph.facebook.com/v21.0';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResponse> {
    return this.executeWithRetry(async () => {
      const response = await axios.post<WhatsAppMessageResponse>(
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
    });
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
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
    } catch (error) {
      // Mark as read failures shouldn't break the flow
      console.error('Failed to mark message as read:', this.formatError(error));
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        await this.delay(this.retryDelay);
        return this.executeWithRetry(fn, retries - 1);
      }
      throw this.formatError(error);
    }
  }

  private isRetryable(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false;
    
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private formatError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const whatsappError = error.response?.data as WhatsAppError | undefined;
      
      if (whatsappError?.error) {
        return new Error(
          `WhatsApp API Error: ${whatsappError.error.message} (Code: ${whatsappError.error.code})`
        );
      }
      
      return new Error(
        `WhatsApp API request failed: ${error.message}`
      );
    }
    
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}