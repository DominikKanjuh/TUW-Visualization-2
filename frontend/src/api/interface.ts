/**
 * @fileoverview Interface definitions for the frontend API client
 * @module frontend/api/interface
 */

/**
 * Represents a single stipple point with location and value
 * @interface Stiple
 */
export interface Stiple {
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lng: number;
  /** Value at this point (e.g., pollution level, temperature) */
  val: number;
}

/**
 * Response structure from the stipples API
 * @interface StiplesResponse
 */
export interface StiplesResponse {
  /** 2D array of stipples representing the grid */
  stiples: Array<Array<Stiple>>;
}

/**
 * Query parameters for the stipples API
 * @interface StiplesQueryParams
 */
export interface StiplesQueryParams {
  /** Minimum latitude of the bounding box */
  minLat: string;
  /** Maximum latitude of the bounding box */
  maxLat: string;
  /** Minimum longitude of the bounding box */
  minLng: string;
  /** Maximum longitude of the bounding box */
  maxLng: string;
  /** Width of the output grid */
  w: string;
  /** Height of the output grid */
  h: string;
}

/**
 * Available dataset types for stippling
 * @typedef {string} DataSetType
 */
export type DataSetType = "air_pollution" | "temperature" | "earth_relief";
