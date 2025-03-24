/**
 * Utility functions for URL handling.
 */

/**
 * Validates and sanitizes a paper URL.
 * 
 * @param url - The URL to validate and sanitize
 * @returns The sanitized URL
 * @throws Error if the URL is invalid
 */
export function validateAndSanitizeUrl(url: string): string {
  // Remove any whitespace
  const trimmedUrl = url.trim();
  
  // Basic URL validation
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    throw new Error('Invalid URL. URL must begin with http:// or https://');
  }
  
  // Remove any query parameters for arXiv URLs (keep them for other URLs)
  if (trimmedUrl.startsWith('https://arxiv.org/abs/')) {
    return trimmedUrl.split('?')[0];
  }
  
  return trimmedUrl;
}

/**
 * Determines if a URL is an arXiv URL.
 * 
 * @param url - The URL to check
 * @returns True if the URL is an arXiv URL, false otherwise
 */
export function isArxivUrl(url: string): boolean {
  // Check for various arXiv URL patterns
  return url.includes('arxiv.org') && (
    url.includes('/abs/') || 
    url.includes('/pdf/') || 
    url.match(/\d+\.\d+/) !== null
  );
} 