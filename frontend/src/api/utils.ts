/**
 * @fileoverview Utility functions for API requests and query string handling
 * @module frontend/api/utils
 */

/**
 * Builds a query string from an object of key-value pairs
 * @param {Record<string, any>} params - Object containing query parameters
 * @returns {string} Formatted query string without the leading '?'
 * @example
 * buildQueryString({ lat: 123, lng: 456 }) // returns "lat=123&lng=456"
 */
const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined) {
      query.append(key, String(params[key]));
    }
  }
  return query.toString();
};

/**
 * Makes a GET request to an API endpoint and parses the JSON response
 * @template T - Type of the expected response data
 * @param {string} endpoint - The API endpoint URL
 * @param {Record<string, any>} [params] - Optional query parameters
 * @returns {Promise<T>} Promise resolving to the parsed response data
 * @throws {Error} If the response is not OK or if JSON parsing fails
 * @example
 * const data = await getJson<UserData>('/api/user', { id: 123 });
 */
export const getJson = async <T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<T> => {
  const queryString = params ? `?${buildQueryString(params)}` : "";
  const url = `${endpoint}${queryString}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};
