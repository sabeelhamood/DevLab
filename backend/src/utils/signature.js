import crypto from 'crypto';

/**
 * Build message for ECDSA signing
 * Format: "educoreai-{serviceName}-{payloadHash}"
 * @param {string} serviceName - Service name
 * @param {Object} payload - Payload object to sign (optional)
 * @returns {string} Message string for signing
 */
export function buildMessage(serviceName, payload) {
  let message = `educoreai-${serviceName}`;
  
  if (payload) {
    // CRITICAL: Use JSON.stringify (not custom stable stringify) to match Coordinator
    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256')
      .update(payloadString)
      .digest('hex');
    message = `${message}-${payloadHash}`;
  }
  
  return message;
}

/**
 * Generate ECDSA P-256 signature
 * Uses createSign API to match Coordinator's signature format
 * @param {string} serviceName - Service name
 * @param {string} privateKeyPem - Private key in PEM format
 * @param {Object} payload - Payload object to sign (optional)
 * @returns {string} Base64-encoded signature
 */
export function generateSignature(serviceName, privateKeyPem, payload = null) {
  if (!privateKeyPem || typeof privateKeyPem !== 'string') {
    throw new Error('Private key is required and must be a string');
  }

  if (!serviceName || typeof serviceName !== 'string') {
    throw new Error('Service name is required and must be a string');
  }

  try {
    // Build message for signing
    const message = buildMessage(serviceName, payload);
    
    // Use createSign API to match Coordinator's format
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    sign.end();
    
    // Sign with private key and return Base64-encoded signature
    const signature = sign.sign(privateKeyPem, 'base64');
    // Ensure no trailing whitespace/newlines
    return typeof signature === 'string' ? signature.trim() : signature;
  } catch (error) {
    throw new Error(`Signature generation failed: ${error.message}`);
  }
}

/**
 * Verify ECDSA P-256 signature
 * Uses createVerify API to match Coordinator's signature format
 * @param {string} serviceName - Service name
 * @param {string} signature - Base64-encoded signature to verify
 * @param {string} publicKeyPem - Public key in PEM format
 * @param {Object} payload - Payload object that was signed (optional)
 * @returns {boolean} True if signature is valid
 */
export function verifySignature(serviceName, signature, publicKeyPem, payload = null) {
  if (!publicKeyPem || !signature) {
    return false;
  }

  try {
    // Build message for verification
    const message = buildMessage(serviceName, payload);
    
    // Use createVerify API to match Coordinator's format
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    verify.end();
    
    // Verify signature with public key
    return verify.verify(publicKeyPem, signature, 'base64');
  } catch (error) {
    return false;
  }
}




