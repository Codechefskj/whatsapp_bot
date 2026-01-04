import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { config } from './config';
import whatsappRoutes from './routes/whatsapp.routes';

// ✅ Verify environment variables at startup
console.log('🔍 Checking configuration...');
console.log('  Port:', config.port);
console.log('  Phone Number ID:', config.meta.phoneNumberId ? '✅ Set' : '❌ Missing');
console.log('  Access Token:', config.meta.accessToken ? '✅ Set' : '❌ Missing');
console.log('  Verify Token:', config.meta.webhookVerifyToken ? '✅ Set' : '❌ Missing');
console.log('  Database URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

app.use('/whatsapp', whatsappRoutes);

app.get('/health', (_req, res) => {
  res.send('OK');
});

app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});