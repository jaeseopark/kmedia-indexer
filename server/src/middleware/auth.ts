/**
 * Authentication middleware for ingest endpoint (scraper workers) and health page
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const INGEST_API_KEY = process.env.INGEST_API_KEY || 'super-secret-worker-key';
const JWT_SECRET = process.env.JWT_SECRET || 'health-page-secret-key';
const JWT_EXPIRY = '7d';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Middleware to authenticate ingest endpoint using Bearer token
 */
export function authenticateIngestWorker(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token || token !== INGEST_API_KEY) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing bearer token' });
    return;
  }

  next();
}

/**
 * Middleware to validate JWT from cookie
 */
export function validateJWTCookie(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch (err) {
    res.clearCookie('auth_token');
    next();
  }
}

/**
 * Generate JWT token
 */
export function generateAuthToken(): string {
  return jwt.sign({ sub: 'health-admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify API key
 */
export function verifyAPIKey(apiKey: string): boolean {
  return apiKey === INGEST_API_KEY;
}
