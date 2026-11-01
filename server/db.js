import { neon } from './db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

const FALLBACK_DATABASE_URL = 'postgresql://neondb_owner:npg_2LDEMd9aHCBG@ep-proud-fire-b4b756gw-pooler.c-6.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
const sql = neon(process.env.DATABASE_URL || FALLBACK_DATABASE_URL);

export default sql;
