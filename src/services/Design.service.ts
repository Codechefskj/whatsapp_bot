import { Design } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { WhatsAppService } from './whatsapp.service';

export class DesignService {
  constructor(private wa: WhatsAppService) {}

  /**
   * Call this when a design is ready.
   * Saves a Design row, uploads the image, sends it with "Approved" / "Not approved" buttons.
   */
  async sendForApproval(opts: {
    to: string;
    image: Buffer;
    mimeType: string;
    filename?: string;
    externalRef?: string;
    caption?: string;
    handoffKey?: string;
  }): Promise<Design> {
    const to = opts.to.replace(/\D/g, ''); // "+91 98765-43210" -> "919876543210" (matches webhook `from`)

    if (opts.handoffKey) {
      const existing = await prisma.design.findUnique({ where: { handoffKey: opts.handoffKey } });
      if (existing) return existing;
    }
    const design = await prisma.design.create({ data: { to, externalRef: opts.externalRef, handoffKey: opts.handoffKey } });

    try {
      const mediaId = await this.wa.uploadMedia(opts.image, opts.filename || 'design.png', opts.mimeType);
      await prisma.design.update({ where: { id: design.id }, data: { mediaId } });
      await this.wa.sendDesignWithButtons(to, mediaId, design.id, opts.caption);
      return { ...design, mediaId };
    } catch (err) {
      // Nothing reached the user, so don't leave a PENDING row behind
      await prisma.design.delete({ where: { id: design.id } }).catch(() => {});
      throw err;
    }
  }

  /** User tapped "Approved" or "Not approved". */
  async handleButtonReply(from: string, buttonId: string, messageId: string, duplicate = false): Promise<void> {
    const match = /^(approve|reject):(\d+)$/.exec(buttonId);
    if (!match) {
      console.log('ℹ️ Unknown button id:', buttonId);
      return;
    }
    const approved = match[1] === 'approve';
    const designId = Number(match[2]);
    if (approved) {
      const queued = await prisma.integrationJob.findUnique({ where: { dedupeKey: `agentic:approve:${messageId}` } });
      if (queued) return;
    }

    // Atomic claim: only succeeds if this design belongs to this user AND is still PENDING.
    // Blocks double-clicks, Meta retries, and people answering someone else's design.
    const claimed = await prisma.$transaction(async tx => {
      const result = await tx.design.updateMany({
        where: { id: designId, to: from, status: 'PENDING' },
        data: approved
          ? { status: 'APPROVED', respondedAt: new Date() }
          : { status: 'AWAITING_FEEDBACK' },
      });
      if (!result.count || !approved) return result;
      const design = await tx.design.findUnique({ where: { id: designId } });
      if (!design?.externalRef) throw new Error('This approval is missing its Agentic job reference.');
      await tx.integrationJob.upsert({
        where: { dedupeKey: `agentic:approve:${messageId}` },
        create: {
          kind: 'AGENTIC_FEEDBACK',
          dedupeKey: `agentic:approve:${messageId}`,
          payload: { to: from, designId, externalRef: design.externalRef, action: 'APPROVE_ALL', messageId },
        },
        update: {},
      });
      return result;
    });

    if (claimed.count === 0) {
      if (duplicate) return;
      await this.wa.sendTextMessage(from, 'This design was already answered or is no longer available.');
      return;
    }

    if (approved) {
      await this.wa.sendTextMessage(from, '✅ Approval received. Final exports and publishing are now being prepared.');
    } else {
      await this.wa.sendTextMessage(
        from,
        "Sorry it wasn't right 🙏\nPlease type what you'd like us to change and we'll fix it."
      );
    }
  }

  /**
   * Call for every incoming text message.
   * Returns true if the message was the user's comment for a design they marked "Not approved"
   * (the caller must then NOT treat it as a normal message).
   */
  async handleFeedback(from: string, text: string, messageId: string): Promise<boolean> {
    const waiting = await prisma.design.findFirst({
      where: { to: from, status: 'AWAITING_FEEDBACK' },
      orderBy: { createdAt: 'desc' },
    });
    if (!waiting) return false;

    if (!waiting.externalRef) throw new Error('This revision request is missing its Agentic job reference.');
    const done = await prisma.$transaction(async tx => {
      const result = await tx.design.updateMany({
        where: { id: waiting.id, status: 'AWAITING_FEEDBACK' },
        data: { status: 'REJECTED', feedback: text, respondedAt: new Date() },
      });
      if (!result.count) return result;
      await tx.integrationJob.upsert({
        where: { dedupeKey: `agentic:edit:${messageId}` },
        create: {
          kind: 'AGENTIC_FEEDBACK',
          dedupeKey: `agentic:edit:${messageId}`,
          payload: {
            to: from, designId: waiting.id, externalRef: waiting.externalRef,
            action: 'EDIT_SELECTED', feedback: text, messageId,
          },
        },
        update: {},
      });
      return result;
    });
    if (done.count === 0) return false;

    await this.wa.sendTextMessage(from, '📝 Thanks for the feedback! We will work on it and send you a new version.');
    return true;
  }
}