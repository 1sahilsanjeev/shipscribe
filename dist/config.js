import dotenv from 'dotenv';
// Load .env dynamically for local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    dotenv.config();
}
const nodeEnv = process.env.NODE_ENV || 'development';
export const config = {
    port: process.env.PORT || 3001,
    jwtSecret: process.env.JWT_SECRET || (nodeEnv === 'production' ? 'missing_prod_secret' : 'dev_secret_key_1234567890'),
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    nodeEnv,
    dbPath: process.env.DB_PATH || 'shipscribe.db',
    databaseUrl: process.env.DATABASE_URL, // Present in prod
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY
};
