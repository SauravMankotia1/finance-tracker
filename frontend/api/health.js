import { isUsingPostgres } from './_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'UP',
    service: 'FinFlow Vercel Serverless API',
    runtime: 'Node.js',
    database: isUsingPostgres() ? 'Supabase PostgreSQL' : 'Embedded Memory Store (Configure DATABASE_URL for Cloud Supabase)',
    timestamp: new Date().toISOString(),
  });
}
