import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import whatsappRoutes from './routes/whatsapp.routes';

const app = express();

/* ===================== CONFIG ===================== */
const VERIFY_TOKEN = 'bestsecretkeytoverify';
const PORT = process.env.PORT || 3001;

/* ===================== MIDDLEWARES ===================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

/* ===================== META WEBHOOK VERIFICATION ===================== */
/**
 * Meta ONLY uses this GET route to verify callback URL
 */
app.get('/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔐 Meta verification:', { mode, token, challenge });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge);
  }

  console.log('❌ Verification failed');
  return res.sendStatus(403);
});

/* ===================== BASIC ROUTES ===================== */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'running',
    message: 'WhatsApp Bot Server',
    endpoints: {
      health: '/health',
      webhook: '/whatsapp/webhook',
    },
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.send('OK');
});

/* ===================== WHATSAPP ROUTES ===================== */
app.use('/whatsapp', whatsappRoutes);

/* ===================== 404 ===================== */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

/* ===================== START ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
