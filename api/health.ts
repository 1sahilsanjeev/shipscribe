export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'ok', 
    source: 'api_folder_ts_nuclear',
    timestamp: new Date().toISOString(),
    diagnostics: {
      supabase_url: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      supabase_service_key: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING',
      supabase_anon_key: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      anthropic_key: process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING',
      jwt_secret: process.env.JWT_SECRET ? 'SET' : 'MISSING'
    }
  });
}
