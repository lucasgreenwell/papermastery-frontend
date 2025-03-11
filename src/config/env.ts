/**
 * Environment configuration for the Paper Mastery application.
 * This file provides a centralized way to access environment-specific variables.
 */

/**
 * Environment configuration interface
 */
interface Env {
  API_URL: string;
  API_TIMEOUT: number;
  API_VERSION: string;
}

/**
 * Default environment values
 */
const defaultEnv: Env = {
  API_URL: 'http://localhost:8000',
  API_TIMEOUT: 30000,
  API_VERSION: 'v1',
};

/**
 * Get environment variables with type safety
 */
const getEnvValue = <T>(key: string, defaultValue: T): T => {
  const envKey = `VITE_${key}`;
  const value = import.meta.env[envKey];
  return value !== undefined ? (value as T) : defaultValue;
};

/**
 * Environment configuration
 */
export const env: Env = {
  API_URL: getEnvValue('API_URL', defaultEnv.API_URL),
  API_TIMEOUT: getEnvValue('API_TIMEOUT', defaultEnv.API_TIMEOUT),
  API_VERSION: getEnvValue('API_VERSION', defaultEnv.API_VERSION),
};

/**
 * Validate required environment variables
 */
const validateEnv = () => {
  const requiredVars: (keyof Env)[] = ['API_URL'];
  
  for (const key of requiredVars) {
    if (!env[key]) {
      console.error(`Missing required environment variable: ${key}`);
    }
  }
};

// Run validation
validateEnv(); 