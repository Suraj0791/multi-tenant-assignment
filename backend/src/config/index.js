import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

console.log('--- CONFIG: Environment Variables ---');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  resendApiKey: process.env.RESEND_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
