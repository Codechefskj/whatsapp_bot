import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config';
import whatsappRoutes from './routes/whatsapp.routes.js';

const app = express();

/**
 * ✅ MUST-HAVE middlewares
 */
app.use(cors());
app.use(express.json()); // IMPORTANT
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**
 * 🔍 Global request logger (VERY IMPORTANT for debugging)
 */
app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

/**
 * WhatsApp routes
 */
app.use('/whatsapp', whatsappRoutes);

/**
 * Health check
 */
app.get('/health', (_req, res) => {
  res.send('OK');
});

/**
 * Start server
 */
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
