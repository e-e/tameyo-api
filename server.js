const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('request').defaults({ encoding: null });
const favicon = require('serve-favicon');
const bodyparser = require('body-parser');
const jsonparser = bodyparser.json({ type: 'application/json' });
const sharp = require('sharp');
const app = express();
let SIZE = process.env.IMG_SIZE || 200;
SIZE = parseInt(SIZE, 10);

const logger = (() => {
  if (process.env.NODE_ENV === 'development') {
    return (req, res, next) => {
      let src = req.body && req.body.src && req.body.src.length ? ` [${req.body.src}]` : '';
      console.log(`${req.method} ${req.url}${src}`);
      next();
    };
  } else {
    return (req, res, next) => { next(); };
  }
})();

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

app.use(favicon(path.join(__dirname, './public', 'favicon.ico')));

app.post('/api/base64', [jsonparser, logger], async (req, res) => {
  const { src } = req.body;
  request.get(src, (err, _res, body) => {
    if (isBase64(src)) {
      res.send({ base64: src })
    } else {
      sharp(body)
        .resize(SIZE)
        .toBuffer()
        .then(data => {
          res.send({ base64: `data:${mime(src)};base64,${data.toString('base64')}` });
        });
    }
  });
});

app.get('/', (req, res) => {
  res.send(process.env.HEROKU_APP_NAME || 'server');
});

let server;
if (process.env.NODE_ENV === 'development') {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, './certs/localhost.key')),
    cert: fs.readFileSync(path.join(__dirname, './certs/localhost.cert')),
    requestCert: false,
    rejectUnauthorized: false
  };
  server = https.createServer(httpsOptions, app);
} else {
  server = app;
}

// keep heroku server awake
if (process.env.HEROKU_APP_NAME) {
  setInterval(function () {
    https.get(`https://${HEROKU_APP_NAME}.herokuapp.com`);
  }, 300000); // every 5 minutes
}

module.exports = server;