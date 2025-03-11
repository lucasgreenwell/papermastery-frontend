/**
 * Environment configuration for the application.
 * This module provides a centralized way to access environment-specific variables.
 */

// Default values for environment variables
const defaults = {
  API_URL: 'http://localhost:8000',
  API_TIMEOUT: 30000,
  API_VERSION: 'v1',
};

// Type definition for environment configuration
interface Env {
  API_URL: string;
  API_TIMEOUT: number;
  API_VERSION: string;
}

/**
 * Get environment variable with fallback to default value
 */
function getEnvVar<T>(key: keyof Env, defaultValue: T): T {
  const envVar = import.meta.env[`VITE_${key}`];
  return envVar !== undefined ? (envVar as T) : defaultValue;
}

/**
 * Environment configuration object with type-safe access to environment variables
 */
export const env: Env = {
  API_URL: getEnvVar('API_URL', defaults.API_URL),
  API_TIMEOUT: getEnvVar('API_TIMEOUT', defaults.API_TIMEOUT),
  API_VERSION: getEnvVar('API_VERSION', defaults.API_VERSION),
};

/**
 * Validate that all required environment variables are set
 */
function validateEnv(environment: Env): void {
  const missingVars: string[] = [];

  if (!environment.API_URL) {
    missingVars.push('API_URL');
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Validate environment variables on import
validateEnv(env);

/**
 * Get the full API URL including version
 */
export function getApiUrl(path: string = ''): string {
  const baseUrl = env.API_URL.endsWith('/') ? env.API_URL.slice(0, -1) : env.API_URL;
  const versionPath = `/api/${env.API_VERSION}`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${versionPath}${normalizedPath}`;
} 