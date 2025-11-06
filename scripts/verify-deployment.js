/**
 * Verify Vercel Deployment Script
 * Checks if the deployed version matches the expected version
 */

const https = require('https');

const DEPLOYMENT_URL = process.env.VERCEL_URL || 'https://dev-lab-mocha.vercel.app';
const EXPECTED_VERSION = '2024-01-15-v14-FINAL-RED-BG-DEPLOY';

console.log(`🔍 Verifying deployment at: ${DEPLOYMENT_URL}`);
console.log(`📋 Expected version: ${EXPECTED_VERSION}`);

https.get(DEPLOYMENT_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (data.includes(EXPECTED_VERSION)) {
      console.log('✅ SUCCESS: Deployment contains expected version!');
      process.exit(0);
    } else {
      console.log('❌ FAILED: Deployment does not contain expected version');
      console.log('Current deployment may be outdated');
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error verifying deployment:', err.message);
  process.exit(1);
});

