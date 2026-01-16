import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { WhatsAppService } from '../services/whatsapp.service'
import { prisma } from '../lib/prisma'

const router = Router()
const whatsappService = new WhatsAppService()

/* ================= MULTER ================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
})

const multerErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    return res.status(413).json({
      success: false,
      error: 'Image too large (max 20MB)',
    })
  }
  next(err)
}

/* ================= SEND DESIGN ================= */
router.post(
  '/send-design',
  upload.single('image'),
  multerErrorHandler,
  async (req: Request, res: Response) => {
    try {
      const { approver, recipientPhone } = req.body
      const imageBuffer = req.file?.buffer

      if (!imageBuffer || !recipientPhone) {
        return res.status(400).json({
          success: false,
          error: 'Missing image or phone number',
        })
      }

      const result = await whatsappService.sendDesignApproval(
        recipientPhone,
        imageBuffer,
        approver
      )

      await prisma.whatsAppMessage.create({
        data: {
          from: 'system',
          text: `Design sent by ${approver}`,
          messageId: result.messageId,
        },
      })

      return res.json({ success: true })
    } catch (err) {
      console.error('❌ Send design error:', err)
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      })
    }
  }
)

/* ================= WEBHOOK ================= */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value

    if (value?.statuses) return res.sendStatus(200)

    const msg = value?.messages?.[0]
    if (!msg) return res.sendStatus(200)

    let text = '[unsupported]'

    if (msg.type === 'text') text = msg.text.body
    if (msg.type === 'image') text = msg.image.caption || '[image]'

    await prisma.whatsAppMessage.create({
      data: {
        from: msg.from,
        text,
        messageId: msg.id,
      },
    })

    console.log('📩 Incoming:', text)
    res.sendStatus(200)
  } catch (err) {
    console.error('❌ Webhook error:', err)
    res.sendStatus(500)
  }
})

/* ================= INBOX ================= */
router.get('/inbox', async (_req: Request, res: Response) => {
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { createdAt: 'desc' },
  })
  res.json(messages)
})

export default router