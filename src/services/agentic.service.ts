import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';

export type AgenticResult = {
  kind: 'clarification_required' | 'design_ready' | 'approved' | 'revision_ready';
  reused?: boolean;
  draft?: { id: string; status: string };
  question?: { id: string; prompt: string; options?: string[] };
  job?: { id: string; status: string };
};

export class AgenticService {
  private get headers() {
    return { Authorization: `Bearer ${config.agentic.internalToken}` };
  }

  async processMessage(input: {
    phone: string;
    messageId: string;
    text?: string;
    productDraftId?: string | null;
    questionId?: string | null;
    file?: { buffer: Buffer; mimeType: string; filename: string };
  }): Promise<AgenticResult> {
    const form = new FormData();
    const metadata = {
      merchantId: input.phone,
      conversationId: `whatsapp:${input.phone}`,
      messageId: input.messageId,
      productDraftId: input.productDraftId || undefined,
      questionId: input.questionId || undefined,
      mediaRoles: input.file ? { media: 'PRIMARY_PRODUCT' } : undefined,
    };
    form.append('metadata', JSON.stringify(metadata));
    if (input.text) form.append('text', input.text);
    if (input.file) form.append('media', input.file.buffer, { filename: input.file.filename, contentType: input.file.mimeType });
    const response = await axios.post(`${config.agentic.baseUrl}/api/integrations/whatsapp/messages`, form, {
      headers: { ...this.headers, ...form.getHeaders(), 'idempotency-key': input.messageId },
      timeout: config.agentic.requestTimeoutMs,
      maxBodyLength: 20 * 1024 * 1024,
    });
    return response.data;
  }

  async sendFeedback(input: { externalRef: string; action: string; feedback?: string; messageId: string }): Promise<AgenticResult> {
    const response = await axios.post(
      `${config.agentic.baseUrl}/api/integrations/whatsapp/jobs/${encodeURIComponent(input.externalRef)}/feedback`,
      { action: input.action, feedback: input.feedback, messageId: input.messageId },
      { headers: { ...this.headers, 'Content-Type': 'application/json', 'idempotency-key': input.messageId }, timeout: config.agentic.requestTimeoutMs }
    );
    return response.data;
  }
}