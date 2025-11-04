/**
 * Authorization Middleware
 * Role-based access control (RBAC)
 */

import logger from '../utils/logger.js';

/**
 * Check if user has required role
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      logger.warn('Authorization failed', {
        user_id: req.user.learner_id,
        required_roles: roles,
        user_role: userRole,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource
 */
export const requireOwnership = (resourceIdParam = 'learnerId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.learner_id;

    if (resourceId !== userId && req.user.role !== 'admin') {
      logger.warn('Ownership check failed', {
        user_id: userId,
        resource_id: resourceId,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Check if user has permission for specific action
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Permission matrix
    const permissions = {
      learner: [
        'practice:read',
        'competition:read',
        'competition:write',
        'feedback:read'
      ],
      trainer: [
        'practice:read',
        'practice:write',
        'question:validate',
        'content:read'
      ],
      admin: ['*'] // All permissions
    };

    const userPermissions = permissions[req.user.role] || [];

    if (!userPermissions.includes(permission) && !userPermissions.includes('*')) {
      logger.warn('Permission check failed', {
        user_id: req.user.learner_id,
        required_permission: permission,
        user_role: req.user.role,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Required permission: ${permission}`
      });
    }

    next();
  };
};



