import { isUsingPostgres } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  return res.status(200).json({
    status: 'UP',
    service: 'FinFlow Vercel Serverless API',
    runtime: 'Node.js',
    database: isUsingPostgres()
      ? 'Supabase Cloud PostgreSQL (Connected)'
      : 'Embedded Memory Store (Configure DATABASE_URL for Cloud Supabase)',
    timestamp: new Date().toISOString(),
  });
}
