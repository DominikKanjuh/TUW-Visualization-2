/**
 * @fileoverview Repository layer for API interactions
 * @module frontend/api/repository
 */

import { StiplesResponse, StiplesQueryParams, DataSetType } from "./interface";
import { getJson } from "./utils";
import * as R from "./routes";

/**
 * Fetch stipples data from the API for a specific dataset
 * @param {DataSetType} datasetType - Type of dataset to fetch (air_pollution, temperature, or earth_relief)
 * @param {StiplesQueryParams} queryParams - Query parameters for the request
 * @returns {Promise<StiplesResponse>} Promise resolving to the stipples grid data
 */
export const fetchStiples = async (
  datasetType: DataSetType,
  queryParams: StiplesQueryParams
): Promise<StiplesResponse> => {
  if (datasetType === "temperature") {
    return getJson<StiplesResponse>(R.temperature, queryParams);
  }

  if (datasetType === "earth_relief") {
    return getJson<StiplesResponse>(R.earthRelief, queryParams);
  }

  return getJson<StiplesResponse>(R.airPollution, queryParams);
};
