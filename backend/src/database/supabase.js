/**
 * Supabase Database Client
 * Connection and operations for Supabase (PostgreSQL)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';

const supabase = createClient(
  config.database.supabase.url,
  config.database.supabase.key
);

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
      throw error;
    }
    
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection failed:', error);
    return false;
  }
};

/**
 * Get Supabase client instance
 */
export const getClient = () => {
  return supabase;
};

export default supabase;





