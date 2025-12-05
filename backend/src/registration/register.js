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
  
  // Use SHORT format (recommended by Coordinator docs)
  // Short format: { name, url, grpc }
  // URL must be a valid URL with protocol (Coordinator validates this)
  const registrationPayload = {
    name: SERVICE_NAME,
    url: cleanServiceEndpoint, // Keep full URL with https:// protocol
    grpc: false // No gRPC support
  };
  
  console.log('📝 Using SHORT format for registration:', {
    name: registrationPayload.name,
    url: registrationPayload.url,
    grpc: registrationPayload.grpc
  });

  // Log registration attempt (without sensitive data)
  console.log('📝 Attempting to register with Coordinator...', {
    coordinatorUrl: cleanCoordinatorUrl,
    serviceName: SERVICE_NAME,
    endpoint: cleanServiceEndpoint,
    payload: registrationPayload
  });

  // Generate ECDSA signature for authentication
  let signature;
  try {
    const { generateSignature } = await import('../utils/signature.js');
    signature = generateSignature(
      SERVICE_NAME, 
      privateKey,
      registrationPayload
    );
    console.log('✓ ECDSA signature generated successfully');
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
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME, 
        'X-Signature': signature,
      };

      const response = await axios.post(registrationUrl, registrationPayload, {
        headers: requestHeaders,
        timeout: 10000, // 10 seconds timeout
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
          requestPayload: registrationPayload,
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

