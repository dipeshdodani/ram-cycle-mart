import { config } from 'dotenv';
import path from 'path';

// Load production environment variables
config({ path: '.env.production' });

export const productionConfig = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
  },
  company: {
    name: process.env.COMPANY_NAME || 'Ram Cycle Mart',
    gstNumber: process.env.COMPANY_GST || '',
    address: process.env.COMPANY_ADDRESS || '',
    phone: process.env.COMPANY_PHONE || '',
    email: process.env.COMPANY_EMAIL || '',
  }
};

// Validate required environment variables
if (!productionConfig.database.url) {
  throw new Error('DATABASE_URL is required in production');
}

if (productionConfig.session.secret === 'change-this-in-production') {
  console.warn('WARNING: Using default session secret. Please set SESSION_SECRET in production!');
}