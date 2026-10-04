const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { encryptData, decryptData } = require('./utils/encryption');

const app = express();
app.use(express.json());
app.use(cors());

const vaultDatabase = {};

app.post('/api/vault/save', (req, res) => {
  const { sessionId, platform, username, cookies } = req.body;
  if (!sessionId || !cookies) {
    return res.status(400).json({ error: 'SessionId and cookies are required!' });
  }
  const encryptedPayload = encryptData(JSON.stringify(cookies));
  vaultDatabase[sessionId] = { platform, username, payload: encryptedPayload };
  res.json({ success: true, message: 'Session stored securely!' });
});

app.post('/api/vault/launch', async (req, res) => {
  const { sessionId, targetUrl } = req.body;
  const sessionData = vaultDatabase[sessionId];
  if (!sessionData) return res.status(404).json({ error: 'Session not found!' });

  try {
    const cookiesArray = JSON.parse(decryptData(sessionData.payload));
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setCookie(...cookiesArray);
    await page.goto(targetUrl || 'https://example.com', { waitUntil: 'networkidle2' });
    res.json({ success: true, message: 'Browser launched with cookies!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));