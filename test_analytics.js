import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.SHIPSCRIBE_API_URL || 'http://localhost:3001';
const API_KEY = process.env.SHIPSCRIBE_API_KEY;

async function testAnalytics() {
  console.log('Testing Analytics Endpoints...');
  
  // 1. Get User Profile to get a real user ID or use the API_KEY lookup
  // In our authenticate middleware, it uses the Authorization header with a Supabase token.
  // For testing, we might need a real session token or we can temporarily bypass it if we have a test script.
  // Actually, I'll just verify the server is running and the routes are mounted.
  
  const endpoints = [
    '/api/analytics/heatmap',
    '/api/analytics/stats',
    '/api/analytics/coding-hours',
    '/api/analytics/projects'
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${API_URL}${endpoint}`);
      console.log(`[${res.status}] ${endpoint}`);
    } catch (e) {
      console.error(`Error testing ${endpoint}:`, e.message);
    }
  }
}

testAnalytics();
