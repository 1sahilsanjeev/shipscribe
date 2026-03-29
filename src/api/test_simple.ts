import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    source: 'test_simple',
    timestamp: new Date().toISOString() 
  });
});

export default (req: any, res: any) => {
  return app(req, res);
};
