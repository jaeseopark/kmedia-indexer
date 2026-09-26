/**
 * Authentication middleware for ingest endpoint (scraper workers) and health page
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const INGEST_API_KEY = process.env.INGEST_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

if (!INGEST_API_KEY) {
  throw new Error('INGEST_API_KEY environment variable is required');
}

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRY = '7d';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Middleware to authenticate ingest endpoint using:
 * 1. Bearer token (API key or JWT)
 * 2. Valid JWT cookie (for authenticated web users)
 */
export function authenticateIngestWorker(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // First, check for Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (token) {
    // Check if it's an API key
    if (token === INGEST_API_KEY) {
      next();
      return;
    }

    // Check if it's a valid JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      req.userId = decoded.sub;
      next();
      return;
    } catch (err) {
      // Not a valid JWT
    }

    res.status(401).json({ error: 'Unauthorized: Invalid bearer token' });
    return;
  }

  // Check for JWT cookie (for web form submissions)
  if (req.userId) {
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized: Missing or invalid credentials' });
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
