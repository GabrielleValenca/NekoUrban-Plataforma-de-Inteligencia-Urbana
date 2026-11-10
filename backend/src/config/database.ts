import 'dotenv/config';
import { Pool } from 'pg';
if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no .env');
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
