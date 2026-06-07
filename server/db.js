import { neon } from './db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

export default sql;
