import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = 'http://localhost:3001/api/auth/heartbeat';
  const payload = {
    api_key: process.env.SHIPSCRIBE_API_KEY,
    editor: 'antigravity',
    platform: 'win32',
    node_version: process.version
  };

  console.log('Sending heartbeat to:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

run();
