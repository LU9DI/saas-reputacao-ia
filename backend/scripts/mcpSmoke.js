// Simple MCP smoke test script
// Attempts to call the health endpoint of the API and logs the status.
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/api/health',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log(`Health check status: ${res.statusCode}`);
    console.log('Response body:', data.trim());
  });
});

req.on('error', (e) => {
  console.error('Health check request error:', e.message);
  process.exit(1);
});

req.end();
