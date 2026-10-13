import { app } from '../server';
import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  // Normalize request url if prefix /api was stripped by rewrites
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
}
