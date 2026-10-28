import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { WhatsAppService } from '../services/whatsapp.service';
import { AIService } from '../services/ai.service';
import { DesignService } from '../services/Design.service';
import { prisma } from '../lib/prisma';
import { config } from '../config';

const router = Router();
const whatsappService = new WhatsAppService();
const aiService = new AIService();
const designService = new DesignService(whatsappService);

// In-memory upload, 5 MB = WhatsApp's image size limit
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const DESIGN_STATUSES = ['PENDING', 'APPROVED', 'AWAITING_FEEDBACK', 'REJECTED'];

console.log('✅ WhatsApp routes loaded');

/**
 * Protects every endpoint that is NOT called by Meta.
 * No new env variable needed: send the header  x-api-key: <value of your META_VERIFY_TOKEN>
 */
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  if (req.header('x-api-key') !== config.meta.webhookVerifyToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/** Save an incoming message. Returns false if Meta re-delivered one we already have. */
async function saveIncoming(from: string, text: string, messageId: string): Promise<boolean> {
  try {
    await prisma.whatsAppMessage.create({ data: { from, text, messageId } });
    return true;
  } catch (e: any) {
    if (e.code === 'P2002') return false; // unique messageId -> duplicate delivery
    throw e;
  }
}

// ============================
// 🔥 WEBHOOK (RECEIVE MESSAGE)
// ============================
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('📩 WhatsApp webhook POST received');
  res.sendStatus(200);

  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      console.log('ℹ️ No user message (status/delivery event)');
      return;
    }

    const from: string = message.from;
    const messageId: string = message.id;

    // ---------- 1) Button click: "Approved" / "Not approved" ----------
    if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
      const { id: buttonId, title } = message.interactive.button_reply;
      console.log(`🔘 Button from ${from}: ${buttonId} (${title})`);

      if (!(await saveIncoming(from, `[button] ${title}`, messageId))) {
        console.log('♻️ Duplicate delivery, skipping');
        return;
      }
      await designService.handleButtonReply(from, buttonId);
      return;
    }

    // ---------- 2) Anything else that is not plain text ----------
    if (message.type !== 'text' || !message.text) {
      console.log(`ℹ️ Unsupported message type: ${message.type}`);
      return;
    }

    // ---------- 3) Text ----------
    const textBody: string = message.text.body;
    const text = textBody.toLowerCase().trim();
    console.log(`📨 From: ${from} | Text: ${textBody}`);

    if (!(await saveIncoming(from, textBody, messageId))) {
      console.log('♻️ Duplicate delivery, skipping');
      return;
    }
    console.log('💾 Saved message to DB');

    // 3a) Is this the comment for a design they just marked "Not approved"?
    if (await designService.handleFeedback(from, textBody)) {
      console.log('📝 Saved as design feedback');
      return;
    }

    // 3b) Normal text flow
    let reply = '';

    if (text === 'help') {
      reply = '👋 Commands:\n• help\n• menu\n• create';
    } else if (text === 'menu') {
      reply = '📋 Menu:\n• create\n• approvals';
    } else if (text === 'create') {
      reply = '🎨 Choose format:\n• Story\n• Post\n• Banner';
    } else {
      // This is where the user's design request goes.
      // Hand textBody to your design system here; when the design is ready, call
      // designService.sendForApproval(...) or POST /whatsapp/designs/send.
      console.log('🤖 Calling AI...');
      try {
        reply = await aiService.getReply(textBody);
      } catch (aiError) {
        reply = '⚠️ You have reached the free limit. Please try again later.';
      }
    }

    console.log('🤖 Reply:', reply);
    await whatsappService.sendTextMessage(from, reply);
    console.log('✅ Reply sent');
  } catch (error: any) {
    console.error('❌ Webhook error:', error.response?.data || error.message);
  }
});

// =======================================================
// 🎨 SEND DESIGN FOR APPROVAL
// multipart/form-data: to=<number>  image=<png|jpg file>  [externalRef]  [caption]
// =======================================================
router.post('/designs/send', requireApiKey, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { to, externalRef, caption } = req.body;
    const file = req.file;

    if (!to || !file) {
      return res.status(400).json({ error: '`to` and an `image` file are required' });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Image must be PNG or JPEG' });
    }

    const design = await designService.sendForApproval({
      to,
      image: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname,
      externalRef,
      caption,
    });

    res.json({ success: true, designId: design.id, status: design.status });
  } catch (error: any) {
    console.error('❌ Send design error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// List designs. Optional filters: ?status=REJECTED  &to=919876543210
// e.g. GET /whatsapp/designs?status=REJECTED  -> designs where the user wrote comments (see `feedback`)
router.get('/designs', requireApiKey, async (req: Request, res: Response) => {
  const where: any = {};

  if (typeof req.query.status === 'string') {
    const status = req.query.status.toUpperCase();
    if (!DESIGN_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${DESIGN_STATUSES.join(', ')}` });
    }
    where.status = status;
  }
  if (typeof req.query.to === 'string') {
    where.to = req.query.to.replace(/\D/g, '');
  }

  const designs = await prisma.design.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(designs);
});

// One design: status + feedback
router.get('/designs/:id', requireApiKey, async (req: Request, res: Response) => {
  const design = await prisma.design.findUnique({ where: { id: Number(req.params.id) } });
  if (!design) return res.status(404).json({ error: 'Design not found' });
  res.json(design);
});

// ============================
// 🔒 TEST / ADMIN ENDPOINTS (need the x-api-key header)
// ============================
router.post('/send-test', requireApiKey, async (req: Request, res: Response) => {
  try {
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: 'to and text are required' });
    }

    console.log('🧪 Sending test message...');
    const result = await whatsappService.sendTextMessage(to, text);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('❌ Send test error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

router.get('/test-db', requireApiKey, async (_req: Request, res: Response) => {
  const count = await prisma.whatsAppMessage.count();
  const messages = await prisma.whatsAppMessage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ count, messages });
});

router.get('/inbox', requireApiKey, async (_req: Request, res: Response) => {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

router.get('/test-ai', requireApiKey, async (_req: Request, res: Response) => {
  try {
    const reply = await aiService.getReply('test question');
    res.json({ success: true, reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;