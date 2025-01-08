export interface QueryParams {
  minLat: string;
  maxLat: string;
  minLng: string;
  maxLng: string;
  w: string;
  h: string;
}

export interface ValidatedParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  w: number;
  h: number;
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

export interface StiplesRow {
  lat: string;
  lng: string;
  val: string;
}

export interface Stiple {
  lat: number;
  lng: number;
  val: number;
}

export interface PostgresError extends Error {
  code?: string;
}
