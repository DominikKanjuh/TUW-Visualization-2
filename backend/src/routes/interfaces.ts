/**
 * @fileoverview Interface definitions for the stippling API
 * @module backend/routes/interfaces
 */

/**
 * Raw query parameters received from the client request
 * @interface QueryParams
 */
export interface QueryParams {
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
  /** Optional total number of stipples to generate */
  total_stiples?: string;
}

/**
 * Validated and parsed query parameters
 * @interface ValidatedParams
 */
export interface ValidatedParams {
  /** Minimum latitude (-90 to 90) */
  minLat: number;
  /** Maximum latitude (-90 to 90) */
  maxLat: number;
  /** Minimum longitude (-180 to 180) */
  minLng: number;
  /** Maximum longitude (-180 to 180) */
  maxLng: number;
  /** Width of the output grid (positive integer) */
  w: number;
  /** Height of the output grid (positive integer) */
  h: number;
  /** Optional total number of stipples */
  total_stiples?: number;
}

/**
 * Successful parameter validation result
 * @interface ValidationSuccess
 */
export interface ValidationSuccess {
  isValid: true;
  params: ValidatedParams;
}

/**
 * Failed parameter validation result
 * @interface ValidationFailure
 */
export interface ValidationFailure {
  isValid: false;
  error: string;
}

/** Union type for validation results */
export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Raw stipple data from PostgreSQL query
 * @interface StipplesRow
 */
export interface StipplesRow {
  lat: string;
  lng: string;
  val: string;
}

/**
 * Processed stipple data with numeric values
 * @interface Stipple
 */
export interface Stipple {
  lat: number;
  lng: number;
  val: number;
}

/**
 * Extended Error interface for PostgreSQL errors
 * @interface PostgresError
 * @extends Error
 */
export interface PostgresError extends Error {
  code?: string;
}

/**
 * Available dataset types for stippling
 * @typedef {string} DatasetType
 */
export type DatasetType = "air_pollution" | "temperature" | "earth_relief";

/**
 * Configuration for a dataset table
 * @interface TableConfig
 */
export interface TableConfig {
  /** Name of the PostgreSQL table */
  tableName: string;
  /** Name of the column containing the raster data */
  valueColumn: string;
}

/**
 * Configuration mapping for all available datasets
 * @const DATASET_CONFIGS
 */
export const DATASET_CONFIGS: Record<DatasetType, TableConfig> = {
  air_pollution: {
    tableName: "air_pollution",
    valueColumn: "rast",
  },
  temperature: {
    tableName: "temperature",
    valueColumn: "rast",
  },
  earth_relief: {
    tableName: "earth_relief",
    valueColumn: "rast",
  },
};
