/**
 * Builds a query string from an object of key-value pairs.
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
 * A generic GET request function using fetch.
 * @param endpoint - The API endpoint.
 * @param params - Query parameters to append to the URL.
 * @returns The parsed JSON response of type T.
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
