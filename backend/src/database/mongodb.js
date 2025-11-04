/**
 * MongoDB Database Client
 * Connection and operations for MongoDB Atlas
 */

import { MongoClient } from 'mongodb';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';

let client = null;
let db = null;

/**
 * Connect to MongoDB
 */
export const connect = async () => {
  try {
    if (client) {
      return client;
    }

    client = new MongoClient(config.database.mongodb.url);
    await client.connect();
    
    db = client.db('devlab');
    
    logger.info('MongoDB connection successful');
    return client;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
};

/**
 * Get database instance
 */
export const getDb = () => {
  if (!db) {
    throw new Error('MongoDB not connected. Call connect() first.');
  }
  return db;
};

/**
 * Close MongoDB connection
 */
export const close = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
};

/**
 * Log error to MongoDB
 */
export const logError = async (errorData) => {
  try {
    const db = getDb();
    await db.collection('error_logs').insertOne({
      ...errorData,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to log error to MongoDB:', error);
  }
};

/**
 * Log API request to MongoDB
 */
export const logApiRequest = async (requestData) => {
  try {
    const db = getDb();
    await db.collection('api_request_logs').insertOne({
      ...requestData,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to log API request to MongoDB:', error);
  }
};

export default {
  connect,
  getDb,
  close,
  logError,
  logApiRequest
};



