/**
 * Authentication middleware for ingest endpoint (scraper workers)
 */
import { Request, Response, NextFunction } from 'express';

const INGEST_API_KEY = process.env.INGEST_API_KEY || 'super-secret-worker-key';

export function authenticateIngestWorker(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token || token !== INGEST_API_KEY) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing bearer token' });
    return;
  }

  next();
}
