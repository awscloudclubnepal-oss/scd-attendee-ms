/**
 * Load Test Script for AWS Ticket API with BullMQ
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

interface TestResult {
  scenario: string;
  totalRequests: number;
  concurrent: number;
  successCount: number;
  failCount: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
}

function generateAttendee(index: number, name:string) {
  return {
    full_name: `Test User ${index}`,
    email: `testmail+${name}${index}@gmail.com`,
    phone: `+977-98${String(Math.floor(10000000 + Math.random() * 90000000))}`,
    food_preference: 'vegetarian',
    session_choice: ['Opening Keynote'],
  };
}

async function getToken(): Promise<string> {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, {
    username: 'user',
    password: 'user',
  });
  return res.data.accessToken;
}

async function runTest(token: string, count: number, name: string): Promise<{ success: boolean; time: number }[]> {
  const start = Date.now();
  const promises = Array.from({ length: count }, (_, i) => {
    const data = generateAttendee(i,name);
    return axios.post(`${API_BASE_URL}/attendees`, data, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000,
    })
    .then(() => ({ success: true, time: Date.now() - start }))
    .catch(() => ({ success: false, time: Date.now() - start }));
  });
  
  return Promise.all(promises);
}

async function main() {
  console.log('\n🧪 Load Test Starting...\n');
  
  const token = await getToken();
  console.log('✅ Authenticated\n');
  
  const tests = [
    { name: 'Light', count: 10 },
    { name: 'Medium', count: 30 },
    { name: 'Heavy', count: 60 },
  ];
  
  for (const test of tests) {
    console.log(`🚀 Running ${test.name} test (${test.count} concurrent requests)...`);
    const start = Date.now();
    const results = await runTest(token, test.count, test.name);
    const duration = Date.now() - start;
    
    const success = results.filter(r => r.success).length;
    const times = results.map(r => r.time);
    
    console.log(`✅ Completed in ${duration}ms`);
    console.log(`   Success: ${success}/${test.count}`);
    console.log(`   Avg time: ${(times.reduce((a,b) => a+b, 0) / times.length).toFixed(0)}ms`);
    console.log(`   Throughput: ${((test.count / duration) * 1000).toFixed(2)} req/s\n`);
    
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('✅ All tests completed!\n');
}

main().catch(console.error);
