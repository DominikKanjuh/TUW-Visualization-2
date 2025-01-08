export interface Stiple {
  lat: number;
  lng: number;
  val: number;
}

export interface StiplesResponse {
  stiples: Array<Array<Stiple>>;
}

export interface StiplesQueryParams {
  minLat: string;
  maxLat: string;
  minLng: string;
  maxLng: string;
  w: string;
  h: string;
}

export type DataSetType =
  | "air_pollution"
  | "temperature"
  | "height"
  | "precipitation";
