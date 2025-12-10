import axios from 'axios';
import { generateSignature, verifySignature } from '../../utils/signature.js';

const SERVICE_NAME = process.env.SERVICE_NAME || 'devlab-service'; 

/**
 * Post request to Coordinator with ECDSA signature
 * 
 * This is the ONLY function that should be used for all outbound cross-microservice
 * communication from DevLab. All requests to other microservices (Assessment, Learning
 * Analytics, Content Studio, Course Builder) must be routed through the Coordinator.
 * 
 * The Coordinator URL is read from process.env.COORDINATOR_URL - this MUST be set
 * in the environment configuration.
 * 
 * @param {Object} envelope - Request envelope with requester_service, payload, and response
 * @param {Object} options - Optional configuration
 * @param {string} options.endpoint - Coordinator endpoint path (default: /api/fill-content-metrics/)
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @returns {Promise<Object>} Response data from Coordinator
 * @throws {Error} If COORDINATOR_URL is not set or request fails
 * 
 * @example
 * // Forward theoretical questions to Coordinator
 * await postToCoordinator(envelope, { endpoint: '/api/fill-content-metrics/' })
 */
export async function postToCoordinator(envelope, options = {}) {
  // All outbound requests MUST use COORDINATOR_URL from environment variables
  // Do NOT hardcode Coordinator URLs anywhere in the codebase
  const coordinatorUrl = process.env.COORDINATOR_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const coordinatorPublicKey = process.env.COORDINATOR_PUBLIC_KEY || null; // Optional, for response verification 

  // Validate required environment variables
  if (!coordinatorUrl) {
    throw new Error('COORDINATOR_URL environment variable is required. All outbound microservice communication must route through Coordinator.'); 
  }

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required for signing requests');
  }

  // Clean URL (remove trailing slash) - builds full URL from env variable
  const cleanCoordinatorUrl = coordinatorUrl.replace(/\/$/, '');
  
  // Default endpoint is /api/fill-content-metrics/ (Coordinator proxy endpoint)
  let endpoint = options.endpoint || '/api/fill-content-metrics/';
  
  // Normalize endpoint to always end with exactly one slash
  endpoint = endpoint.replace(/\/+$/, '') + '/';
  
  // Construct full URL: ${COORDINATOR_URL}${endpoint}
  // Example: https://coordinator.example.com/api/fill-content-metrics/
  const url = `${cleanCoordinatorUrl}${endpoint}`;
  const timeout = options.timeout || 30000;

  try {
    // Generate ECDSA signature for the entire envelope
    const rawSignature = generateSignature(SERVICE_NAME, privateKey, envelope);
    const signature = typeof rawSignature === 'string' ? rawSignature.trim() : rawSignature;

    // Send POST request with signature headers
    const response = await axios.post(url, envelope, {
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME,
        'X-Signature': signature,
      },
      timeout,
    });

    // Optional: Verify response signature if Coordinator provides one
    if (coordinatorPublicKey && response.headers['x-service-signature']) {
      const responseSignature = response.headers['x-service-signature'];
      try {
        const isValid = verifySignature(
          'coordinator',
          responseSignature,
          coordinatorPublicKey,
          response.data
        );
        if (!isValid) {
          console.warn('[CoordinatorClient] Response signature verification failed');
        }
      } catch (verifyError) {
        console.warn('[CoordinatorClient] Response signature verification error (non-blocking)', {
          error: verifyError.message,
        });
      }
    }

    return response.data;
  } catch (error) {
    console.error('[CoordinatorClient] Request failed', {
      endpoint,
      error: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
    });

    // Re-throw the error so callers can handle it
    throw error;
  }
}

/**
 * Get Coordinator client instance
 * @returns {Object} Coordinator client methods
 */
export function getCoordinatorClient() {
  return {
    post: postToCoordinator,
  };
}

