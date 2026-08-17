import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-secret';
