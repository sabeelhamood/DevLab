import axios from 'axios';

// Service configuration
const SERVICE_NAME = process.env.SERVICE_NAME || 'devlab-service'; 
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';
const SERVICE_DESCRIPTION = process.env.SERVICE_DESCRIPTION || 'DevLab Backend Service';

const METADATA = {
  team: process.env.SERVICE_TEAM || 'DevLab Team',
  owner: process.env.SERVICE_OWNER || 'system',
  capabilities: process.env.SERVICE_CAPABILITIES 
    ? process.env.SERVICE_CAPABILITIES.split(',')
    : ['question-generation', 'code-execution', 'competitions']
};

/**
 * Exponential backoff delay calculator
 */
function getBackoffDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 16000);
}

/**
 * Register service with Coordinator
 * @returns {Promise<{success: boolean, serviceId?: string, status?: string, error?: string}>}
 */
async function registerWithCoordinator() {
  const coordinatorUrl = process.env.COORDINATOR_URL; 
  const serviceEndpoint = process.env.SERVICE_ENDPOINT || process.env.RAILWAY_PUBLIC_DOMAIN || 'https://devlab-backend-production.up.railway.app'; 
  const privateKey = process.env.PRIVATE_KEY;

  // Validate required environment variables
  if (!coordinatorUrl) {
    const error = 'COORDINATOR_URL environment variable is required';
    console.error(`❌ Registration failed: ${error}`);
    return { success: false, error };
  }

  if (!serviceEndpoint) {
    const error = 'SERVICE_ENDPOINT environment variable is required';
    console.error(`❌ Registration failed: ${error}`);
    return { success: false, error };
  }

  if (!privateKey) {
    const error = 'PRIVATE_KEY environment variable is required for ECDSA signing';
    console.error(`❌ Registration failed: ${error}`);
    return { success: false, error };
  }

  // Clean URLs (remove trailing slashes)
  const cleanCoordinatorUrl = coordinatorUrl.replace(/\/$/, '');
  const cleanServiceEndpoint = serviceEndpoint.startsWith('http') 
    ? serviceEndpoint.replace(/\/$/, '')
    : `https://${serviceEndpoint.replace(/\/$/, '')}`;

  const registrationUrl = `${cleanCoordinatorUrl}/register`;
  
  // Use FULL format (Coordinator requires serviceName, version, endpoint)
  const registrationPayload = {
    serviceName: SERVICE_NAME,
    version: SERVICE_VERSION,
    endpoint: cleanServiceEndpoint, // Full URL with https:// protocol
    healthCheck: '/health',
    description: SERVICE_DESCRIPTION,
    metadata: METADATA
  };

  // Create JSON-safe payload FIRST (removes functions, undefined values, circular refs)
  // This ensures signature is generated from the EXACT payload we send
  let safePayload;
  try {
    safePayload = JSON.parse(JSON.stringify(registrationPayload));
    console.log('📤 Registration payload (JSON-safe):', safePayload);
  } catch (payloadError) {
    const error = `Failed to create JSON-safe payload: ${payloadError.message}`;
    console.error(`❌ Registration failed: ${error}`);
    return { success: false, error };
  }

  console.log('📝 Using FULL format for registration:', {
    serviceName: safePayload.serviceName,
    version: safePayload.version,
    endpoint: safePayload.endpoint
  });

  // Log registration attempt (without sensitive data)
  console.log('📝 Attempting to register with Coordinator...', {
    coordinatorUrl: cleanCoordinatorUrl,
    serviceName: SERVICE_NAME,
    endpoint: cleanServiceEndpoint
  });

  // Generate ECDSA signature using the SAFE payload (must match what we send)
  let signature;
  try {
    const { generateSignature } = await import('../utils/signature.js');
    // CRITICAL: Sign the safePayload, not registrationPayload
    // The signature must match the exact payload we send to Coordinator
    signature = generateSignature(
      SERVICE_NAME, 
      privateKey,
      safePayload
    );
    console.log('✓ ECDSA signature generated successfully');
    console.log('   Signature preview:', signature.substring(0, 20) + '...');
  } catch (signatureError) {
    const error = `Failed to generate ECDSA signature: ${signatureError.message}`;
    console.error(`❌ Registration failed: ${error}`);
    console.error('   Signature error details:', signatureError);
    return { success: false, error };
  }

  // Retry logic with exponential backoff (up to 5 attempts)
  const maxAttempts = 5;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Set headers in both uppercase and lowercase to ensure Coordinator receives them
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME,
        'x-service-name': SERVICE_NAME,
        'X-Signature': signature,
        'x-signature': signature
      };

      // Debug log BEFORE sending request
      console.log('📤 Outgoing headers:', {
        'Content-Type': requestHeaders['Content-Type'],
        'X-Service-Name': requestHeaders['X-Service-Name'],
        'x-service-name': requestHeaders['x-service-name'],
        'X-Signature': requestHeaders['X-Signature'] ? `${requestHeaders['X-Signature'].substring(0, 20)}...` : 'missing',
        'x-signature': requestHeaders['x-signature'] ? `${requestHeaders['x-signature'].substring(0, 20)}...` : 'missing'
      });

      const response = await axios.post(registrationUrl, safePayload, {
        headers: requestHeaders,
        timeout: 10000 // 10 seconds timeout
      });

      // Check if registration was successful
      if (response.status >= 200 && response.status < 300) {
        const serviceId = response.data?.serviceId || response.data?.id || 'unknown';
        const status = response.data?.status || 'pending_migration';

        console.log('✓ Registered with Coordinator', {
          serviceId,
          status,
          attempt: attempt + 1,
        });

        return {
          success: true,
          serviceId,
          status,
        };
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      lastError = error;

      // Clear error logging with all available information
      console.error(`❌ Registration attempt ${attempt + 1} error:`, {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        } : null,
        request: error.request ? {
          headers: error.request.headers || 'Not available'
        } : null
      });

      // Log detailed error information for debugging
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        const headers = error.response.headers;

        console.error(`❌ Coordinator registration error (attempt ${attempt + 1}):`, {
          status,
          statusText: error.response.statusText,
          data: data || 'No response data',
          headers: {
            'content-type': headers['content-type'],
            'x-service-name': headers['x-service-name'],
            'x-service-signature': headers['x-service-signature'] ? 'present' : 'missing'
          },
          requestUrl: registrationUrl,
          requestPayload: safePayload,
          requestHeaders: {
            'Content-Type': 'application/json',
            'X-Service-Name': SERVICE_NAME,
            'X-Signature': signature ? `${signature.substring(0, 20)}...` : 'missing'
          }
        });
      } else if (error.request) {
        console.error('❌ Coordinator registration - no response received:', {
          message: error.message,
          code: error.code,
          requestUrl: registrationUrl
        });
      } else {
        console.error('❌ Coordinator registration - request setup error:', {
          message: error.message,
          stack: error.stack
        });
      }

      // Determine error type and create friendly message
      let errorMessage = 'Unknown error';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          errorMessage = `Unauthorized: Authentication failed. Please verify PRIVATE_KEY is correct.`;
        } else if (status === 404) {
          errorMessage = `Not found: Registration endpoint not available.`;
        } else if (status === 500) {
          // Extract more details from 500 errors
          const errorDetails = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : 'No error details provided';
          errorMessage = `HTTP 500: Coordinator internal error. Details: ${errorDetails}`;
        } else {
          errorMessage = `HTTP ${status}: ${data?.message || data?.error || error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from Coordinator service';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }

      // Log attempt
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt) {
        console.error(`❌ Registration failed after ${maxAttempts} attempts: ${errorMessage}`);
      } else {
        const delay = getBackoffDelay(attempt);
        console.warn(`⚠️ Registration attempt ${attempt + 1}/${maxAttempts} failed: ${errorMessage}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  return {
    success: false,
    error: lastError?.message || 'Registration failed after all retry attempts',
  };
}

/**
 * Register service on startup
 * This function is non-blocking and will not crash the service if registration fails
 */
export async function registerService() {
  try {
    const result = await registerWithCoordinator();

    if (!result.success) {
      console.warn('⚠️ Service registration failed, but continuing startup...', {
        error: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error during service registration', {
      error: error.message,
      stack: error.stack,
    });
    // Don't throw - allow service to continue
  }
}

