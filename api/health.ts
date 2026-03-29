export default function handler(req: any, res: any) {
  res.status(200).json({ 
    status: 'ok', 
    source: 'api_folder_ts',
    timestamp: new Date().toISOString() 
  });
}
