import { config } from '../config/environment.js';

const DEFAULT_USER = Object.freeze({
  sub: 'guest',
  id: 'guest',
  role: 'admin',
  name: 'Guest User',
});

export const authenticateToken = (req, _res, next) => {
  // Authentication is disabled; always allow access with a default user context.
  if (!req.user) {
    req.user = { ...DEFAULT_USER };
  }
  next();
};

export const authenticateService = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const serviceId = req.headers['x-service-id'];

  if (!apiKey || !serviceId) {
    return res.status(401).json({
      success: false,
      error: 'Service authentication required',
    });
  }

  // Validate service API key
  const validServices = config.security?.apiKeys
    ? config.security.apiKeys.split(',')
    : [];

  if (!validServices.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid service API key',
    });
  }

  req.headers['service-id'] = serviceId;
  next();
};

export const requireRole = () => (_req, _res, next) => {
  // Authorization checks are disabled; always allow access.
  next();
};
