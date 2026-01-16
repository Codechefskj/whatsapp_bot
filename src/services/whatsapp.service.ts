import axios from 'axios'
import FormData from 'form-data'
import { config } from '../config'

export class WhatsAppService {
  private baseUrl = 'https://graph.facebook.com/v21.0'

  /* ================= SEND TEXT ================= */
  async sendTextMessage(to: string, text: string) {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/messages`

    const res = await axios.post(
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
    )

    return res.data
  }

  /* ================= UPLOAD IMAGE ================= */
  async uploadMedia(imageBuffer: Buffer) {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/media`

    const formData = new FormData()
    formData.append('file', imageBuffer, {
      filename: 'design.png',
      contentType: 'image/png',
    })
    formData.append('type', 'image/png')
    formData.append('messaging_product', 'whatsapp')

    const res = await axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${config.meta.accessToken}`,
        ...formData.getHeaders(),
      },
    })

    return res.data.id
  }

  /* ================= SEND IMAGE ================= */
  async sendImageMessage(
    to: string,
    mediaId: string,
    caption: string
  ) {
    const url = `${this.baseUrl}/${config.meta.phoneNumberId}/messages`

    const res = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: {
          id: mediaId,
          caption,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.meta.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return res.data
  }

  /* ================= MAIN FLOW ================= */
  async sendDesignApproval(
    to: string,
    imageBuffer: Buffer,
    approverName: string
  ) {
    try {
      console.log('📤 Uploading image...')
      const mediaId = await this.uploadMedia(imageBuffer)

      const caption = `🎨 Design Approval Request

From: ${approverName}

Please review this design.

Reply with:
approve  ✅
reject   ❌`

      console.log('📨 Sending image...')
      const result = await this.sendImageMessage(to, mediaId, caption)

      return {
        success: true,
        mediaId,
        messageId: result.messages[0].id,
      }
    } catch (err: any) {
      console.error('❌ WhatsApp send failed:', err.response?.data || err.message)
      throw err
    }
  }
}
