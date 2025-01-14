/**
 * @fileoverview API endpoint configuration
 * @module frontend/api/routes
 */

/** Base URL for the API */
export const API_BASE = "http://localhost:3000";
/** Base URL for stipples endpoints */
export const STIPPLES_API_BASE = `${API_BASE}/api/stiples`;

/** Endpoint for air pollution dataset */
export const airPollution = `${STIPPLES_API_BASE}/air_pollution`;
/** Endpoint for temperature dataset */
export const temperature = `${STIPPLES_API_BASE}/temperature`;
/** Endpoint for earth relief dataset */
export const earthRelief = `${STIPPLES_API_BASE}/earth_relief`;
