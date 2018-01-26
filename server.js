const https = require('https');
const fs = require('fs');
const express = require('express');
const request = require('request').defaults({ encoding: null });
const bodyparser = require('body-parser');
const jsonparser = bodyparser.json({ type: 'application/json' });
const sharp = require('sharp');
const app = express();

const httpsOptions = {
  key: fs.readFileSync('./certs/localhost.key'),
  cert: fs.readFileSync('./certs/localhost.cert'),
  requestCert: false,
  rejectUnauthorized: false
};

const MIME_TYPES = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
};

function mime(src) {
  src = src.trim().replace(/\?.*$/, '');
  let parts = src.split('.');
  let extn = parts.pop().toLowerCase().trim();
  return MIME_TYPES.hasOwnProperty(extn) ? MIME_TYPES[extn] : '';
}

function isBase64(src) {
  const re = new RegExp('^data\\:');
  return re.test(src.trim());
}

app.post('/api/base64', jsonparser, async (req, res) => {
  const { src } = req.body;
  request.get(src, (err, _res, body) => {
    if (isBase64(src)) {
      res.send({ base64: src })
    } else {
      sharp(body)
        .resize(75)
        .toBuffer()
        .then(data => {
          res.send({ base64: `data:${mime(src)};base64,${data.toString('base64')}` });
        });
    }
  });
});

app.get('/', (req, res) => {
  res.send('server');
});

const server = https.createServer(httpsOptions, app);

module.exports = server;