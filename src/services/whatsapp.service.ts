import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';

export class WhatsAppService {
  private baseUrl = 'https://graph.facebook.com/v21.0';

  /* ================= TEXT MESSAGE ================= */
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

  /* ================= UPLOAD MEDIA ================= */
  async uploadMedia(imageBuffer: Buffer, filename: string = 'design.png') {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/media`;

    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename,
      contentType: 'image/png',
    });
    formData.append('type', 'image/png');
    formData.append('messaging_product', 'whatsapp');

    const response = await axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${config.meta.accessToken}`,
        ...formData.getHeaders(),
      },
    });

    return response.data.id;
  }

  /* ================= SEND IMAGE ================= */
  async sendImageMessage(to: string, mediaId: string, caption?: string) {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { id: mediaId },
    };

    if (caption) {
      payload.image.caption = caption;
    }

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.meta.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /* ================= SEND DESIGN (STABLE & SAFE) ================= */
  async sendDesignApproval(
    to: string,
    imageBuffer: Buffer,
    approverName: string
  ) {
    try {
      console.log('📤 Uploading image to WhatsApp...');
      const mediaId = await this.uploadMedia(imageBuffer);

      console.log('✅ Media uploaded:', mediaId);

      const caption = `🎨 Design Approval Request

From: ${approverName}

Please review and approve this design.

Reply:
✅ approve
❌ reject`;

      console.log('📨 Sending image...');
      const result = await this.sendImageMessage(to, mediaId, caption);

      console.log('✅ Design sent successfully');

      return {
        success: true,
        mediaId,
        messageId: result.messages[0].id,
      };
    } catch (error: any) {
      console.error(
        '❌ Failed to send design:',
        error.response?.data || error.message
      );
      throw error;
    }
  }
}
