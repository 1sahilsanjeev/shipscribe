import { Request, Response } from 'express';

export const handle = (
  fn: (req: any, res: Response) => Promise<void>
) => async (req: any, res: Response) => {
  try {
    await fn(req, res);
  } catch (err: any) {
    console.error('[route] Error:', err.message);
    console.error('[route] Stack:', err.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? err.stack 
          : undefined
      });
    }
  }
};
