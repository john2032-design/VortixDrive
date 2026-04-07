const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let logs = [];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/log', (req, res) => {
  const { level, message, data, pageUrl, timestamp } = req.body;
  if (!level || !message) {
    return res.status(400).json({ error: 'level and message required' });
  }
  const entry = {
    id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    level,
    message,
    data: data || '',
    pageUrl: pageUrl || 'unknown',
    timestamp: timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString()
  };
  logs.unshift(entry);
  if (logs.length > 2000) logs.pop();
  console.log(`[LOG] ${level} from ${pageUrl}: ${message}`);
  res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
  res.json(logs);
});

app.delete('/api/logs', (req, res) => {
  logs = [];
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Log server running on port ${PORT}`);
});