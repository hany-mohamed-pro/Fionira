const http = require('http');

http.get('http://0.0.0.0:3000/api/debug/journalEntries/raw', {
  headers: {
    'Authorization': 'Bearer fake.token.for-dev-mode'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data.substring(0, 100)));
});
