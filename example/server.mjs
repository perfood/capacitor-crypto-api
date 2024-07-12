import {
  CRYPTO_API_ECDSA_KEY_ALGORITHM,
  CRYPTO_API_ECDSA_SIGN_ALGORITHM,
  base64ToArrayBuffer,
  derToP1363,
} from '@perfood/capacitor-crypto-api';
import { btoa } from 'buffer';
import cors from 'cors';
import { webcrypto } from 'crypto';
import express from 'express';
import fs from 'fs';
import https from 'https';

const hostname = 'localhost';
const port = 3001;

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Stores fpr public keys and challenges.
 */
let publicKeys = {};
let challenges = {};

/**
 * Registers a public key for a tag.
 */
app.post('/register', async (req, res) => {
  const { tag, publicKey } = req.body;
  console.log('/register', tag, publicKey);

  if (!tag || !publicKey) {
    return res.status(400).json('Bad request');
  }

  publicKeys[tag] = publicKey;
  console.log('publicKeys', publicKeys);

  res.json({ success: true });
});

/**
 * Chreates a challenge for a tag.
 */
app.post('/challenge', async (req, res) => {
  const { tag } = req.body;
  console.log('/challenge', tag);

  if (!tag) {
    return res.status(400).json('Bad request');
  }

  const challenge = webcrypto.randomUUID();
  challenges[challenge] = tag;
  console.log('challenges', challenges);

  res.json({ challenge });
});

/**
 * Verifies a signature for a challenge.
 */
app.post('/response', async (req, res) => {
  const { challenge, signature } = req.body;
  console.log('/response', challenge, signature);

  if (!challenge || !signature) {
    return res.status(400).json('Bad request');
  }

  const tag = challenges[challenge];
  if (!tag) {
    return res.status(404).json('Challenge not found');
  }

  const publicKey = publicKeys[tag];
  if (!publicKey) {
    return res.status(404).json('Public key not found');
  }

  const verified = await webcrypto.subtle.verify(
    CRYPTO_API_ECDSA_SIGN_ALGORITHM,
    await webcrypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(publicKey),
      CRYPTO_API_ECDSA_KEY_ALGORITHM,
      false,
      ['verify'],
    ),
    derToP1363(base64ToArrayBuffer(signature)),
    base64ToArrayBuffer(btoa(challenge)),
  );

  if (!verified) {
    return res.status(403).json('Invalid signature');
  }

  delete challenges[challenge];
  console.log('challenges', challenges);

  res.json({ verified });
});

/**
 * Create https server.
 */
https
  .createServer(
    {
      key: fs.readFileSync('./cert/key.pem'),
      cert: fs.readFileSync('./cert/cert.pem'),
    },
    app,
  )
  .listen(port, hostname, () => {
    console.log(`Server listening at https://${hostname}:${port}`);
  });
