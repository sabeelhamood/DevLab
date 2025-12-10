// sign.mjs (or sign.js if your project supports ESM)
import fs from 'fs';
import crypto from 'crypto';

const serviceName = 'devlab-service';

// Load private key
const privateKeyPem = fs.readFileSync('devlab-private-key.pem', 'utf8');

// Envelope to sign
const envelope = {
  requester_service: 'devlab',
  payload: {
    action: 'generate-questions',
    topic_id: 123,
    topic_name: 'Arrays',
    question_type: 'theoretical',
    amount: 1,
    skills: ['loops', 'array-methods'],
    humanLanguage: 'en'
  },
  response: { answer: '' }
};

// Hash envelope
const payloadHash = crypto
  .createHash('sha256')
  .update(JSON.stringify(envelope))
  .digest('hex');

// Build message
const message = `educoreai-${serviceName}-${payloadHash}`;

// Sign using DER-encoded ECDSA
const sign = crypto.createSign('SHA256');
sign.update(message);
sign.end();

const signature = sign.sign(privateKeyPem, 'base64').trim();

// Output
console.log('X-Service-Name:', serviceName);
console.log('X-Signature:', signature);
