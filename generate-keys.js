const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SERVICE_NAME = 'devlab-service';

console.log(`Generating ECDSA P-256 key pair for ${SERVICE_NAME}...\n`);

// Generate ECDSA P-256 key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1', // P-256
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Display keys
console.log('='.repeat(80));
console.log('PRIVATE KEY (PEM):');
console.log('='.repeat(80));
console.log(privateKey);
console.log('\n');

console.log('='.repeat(80));
console.log('PUBLIC KEY (PEM):');
console.log('='.repeat(80));
console.log(publicKey);
console.log('\n');

// Save keys to files
const privateKeyPath = path.join(__dirname, 'devlab-private-key.pem');
const publicKeyPath = path.join(__dirname, 'devlab-public-key.pem');

fs.writeFileSync(privateKeyPath, privateKey, 'utf8');
fs.writeFileSync(publicKeyPath, publicKey, 'utf8');

console.log('='.repeat(80));
console.log('Keys saved successfully:');
console.log(`  Private Key: ${privateKeyPath}`);
console.log(`  Public Key:  ${publicKeyPath}`);
console.log('='.repeat(80));




