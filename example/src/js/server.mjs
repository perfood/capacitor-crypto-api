import { atob, btoa } from 'buffer';
import cors from 'cors';
import { webcrypto } from 'crypto';
import express from 'express';
import fs from 'fs';
import https from 'https';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

https
  .createServer(
    {
      key: fs.readFileSync('../../cert/key.pem'),
      cert: fs.readFileSync('../../cert/cert.pem'),
    },
    app,
  )
  .listen(port, () => {
    console.log(`Server listening at https://localhost:${port}`);
  });

let store = {};

app.post('/register', async (req, res) => {
  const { tag, publicKey } = req.body;

  store[tag] = publicKey;

  res.json({ success: true, store: store });
});

app.post('/verify', async (req, res) => {
  const { signed: { signature }, random, tag } = req.body;

  const publicKey = store[tag];
  
  if (!publicKey) {
    return res.status(400).json({ statusText: 'Public key not found' });
  }

  const publicKeyBinary = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0));

  const key = await webcrypto.subtle.importKey(
    'spki',
    publicKeyBinary.buffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['verify']
  );
  
  const valid = await webcrypto.subtle.verify({
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    key,
    base64ToArrayBuffer(signature),
    base64ToArrayBuffer(random),
  );

  if (!valid) {
    return res.status(400).json({ statusText: 'Invalid signature' });
  }

  res.json({ valid: valid });
});

function base64ToArrayBuffer(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

function arrayBufferToBase64(arrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}
