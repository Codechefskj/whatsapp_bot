import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Loading configuration...');
console.log('  PORT:', process.env.PORT || 3001);
console.log('  META_VERIFY_TOKEN:', process.env.META_VERIFY_TOKEN || 'NOT SET');
console.log('  META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? 'SET' : 'NOT SET');
console.log('  META_PHONE_NUMBER_ID:', process.env.META_PHONE_NUMBER_ID || 'NOT SET');

export const config = {
  port: process.env.PORT || 3001,
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN!,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID!,
    webhookVerifyToken: process.env.META_VERIFY_TOKEN!
  }
};