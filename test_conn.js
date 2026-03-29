import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://127.0.0.1:3005/api/stats');
    console.log('127.0.0.1:3005 -> SUCCESS:', res.status);
  } catch (e) {
    console.log('127.0.0.1:3005 -> FAILED:', e.message);
  }

  try {
    const res = await axios.get('http://localhost:3005/api/stats');
    console.log('localhost:3005 -> SUCCESS:', res.status);
  } catch (e) {
    console.log('localhost:3005 -> FAILED:', e.message);
  }
}

test();
