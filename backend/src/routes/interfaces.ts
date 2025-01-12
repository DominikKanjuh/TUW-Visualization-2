export interface QueryParams {
  minLat: string;
  maxLat: string;
  minLng: string;
  maxLng: string;
  w: string;
  h: string;
  total_stiples?: string;
}

export interface ValidatedParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  w: number;
  h: number;
  total_stiples?: number;
}

export interface ValidationSuccess {
  isValid: true;
  params: ValidatedParams;
}

export interface ValidationFailure {
  isValid: false;
  error: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export interface StipplesRow {
  lat: string;
  lng: string;
  val: string;
}

export interface Stipple {
  lat: number;
  lng: number;
  val: number;
}

export interface PostgresError extends Error {
  code?: string;
}

export type DatasetType = "air_pollution" | "temperature" | "earth_relief";

export interface TableConfig {
  tableName: string;
  valueColumn: string;
}

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
