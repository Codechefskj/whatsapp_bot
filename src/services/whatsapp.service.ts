import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';
import { prisma } from '../lib/prisma';

export class WhatsAppService {
  private baseUrl = 'https://graph.facebook.com/v21.0';

  private get authHeaders() {
    return { Authorization: `Bearer ${config.meta.accessToken}` };
  }

  /** Save a message WE sent. A DB problem must never stop the WhatsApp send, so errors are only logged. */
  private async saveOutgoing(to: string, text: string, messageId?: string) {
    if (!messageId) return;
    try {
      await prisma.whatsAppMessage.create({
        data: { from: config.meta.phoneNumberId, to, text, direction: 'OUT', messageId },
      });
    } catch (e: any) {
      console.error('⚠️ Could not save outgoing message:', e.message);
    }
  }

  async sendTextMessage(to: string, text: string) {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/messages`;

    console.log('📤 Sending WhatsApp message...');
    console.log('👉 To:', to);
    console.log('👉 Text:', text);

    try {
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        },
        { headers: { ...this.authHeaders, 'Content-Type': 'application/json' } }
      );

      console.log('✅ Message sent successfully:', response.data);
      await this.saveOutgoing(to, text, response.data?.messages?.[0]?.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ WhatsApp API Error:');
      console.error(error.response?.data || error.message);
      throw error;
    }
  }

  /** Upload an image to WhatsApp and return its media id. WhatsApp accepts PNG/JPEG up to 5 MB. */
  async uploadMedia(buffer: Buffer, filename = 'design.png', mimeType = 'image/png'): Promise<string> {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/media`;

    const formData = new FormData();
    formData.append('file', buffer, { filename, contentType: mimeType });
    formData.append('type', mimeType);
    formData.append('messaging_product', 'whatsapp');

    const response = await axios.post(url, formData, {
      headers: { ...this.authHeaders, ...formData.getHeaders() },
    });

    return response.data.id;
  }

  /** Download media referenced by an inbound Meta webhook. */
  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const metadata = await axios.get(`${this.baseUrl}/${encodeURIComponent(mediaId)}`, {
      headers: this.authHeaders,
      timeout: 30_000,
    });
    if (!metadata.data?.url) throw new Error('Meta media lookup returned no download URL.');
    const response = await axios.get(metadata.data.url, {
      headers: this.authHeaders,
      responseType: 'arraybuffer',
      timeout: 60_000,
      maxContentLength: 15 * 1024 * 1024,
    });
    const mimeType = String(metadata.data.mime_type || response.headers['content-type'] || 'application/octet-stream').split(';')[0];
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    return { buffer: Buffer.from(response.data), mimeType, filename: `whatsapp-${mediaId}.${extension}` };
  }

  /**
   * Image + two reply buttons ("Approved" / "Not approved").
   * Button ids carry the design id so the click can be matched later: "approve:12" / "reject:12".
   * Button titles are limited to 20 characters.
   */
  async sendDesignWithButtons(to: string, mediaId: string, designId: number, bodyText?: string) {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'image', image: { id: mediaId } },
        body: { text: bodyText || 'Here is your design 🎨\nDo you approve it?' },
        action: {
          buttons: [
            { type: 'reply', reply: { id: `approve:${designId}`, title: '✅ Approved' } },
            { type: 'reply', reply: { id: `reject:${designId}`, title: '❌ Not approved' } },
          ],
        },
      },
    };

    try {
      const response = await axios.post(url, payload, {
        headers: { ...this.authHeaders, 'Content-Type': 'application/json' },
      });
      await this.saveOutgoing(
        to,
        `[design #${designId} + buttons] ${payload.interactive.body.text}`,
        response.data?.messages?.[0]?.id
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to send design buttons:', error.response?.data || error.message);
      throw error;
    }
  }
}