import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN!,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID!,
    webhookVerifyToken: process.env.META_VERIFY_TOKEN!,
  },
};

if (!config.meta.accessToken || !config.meta.phoneNumberId || !config.meta.webhookVerifyToken) {
  console.error('❌ Missing Meta environment variables');
  process.exit(1);
}

console.log('✅ Config loaded');
