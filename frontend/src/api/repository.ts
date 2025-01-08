import { StiplesResponse, StiplesQueryParams, DataSetType } from "./interface";
import { getJson } from "./utils";
import * as R from "./routes";

/**
 * Fetch stiples data from the API.
 * @param datasetType - Indicates which dataset to fetch stiples from
 * @param queryParams - Query parameters for the /stiples endpoint.
 * @returns The stiples response.
 */
export const fetchStiples = async (
  datasetType: DataSetType,
  queryParams: StiplesQueryParams
): Promise<StiplesResponse> => {
  if (datasetType === "temperature") {
    return getJson<StiplesResponse>(R.temperature, queryParams);
  }

  if (datasetType === "height") {
    return getJson<StiplesResponse>(R.height, queryParams);
  }

  if (datasetType === "precipitation") {
    return getJson<StiplesResponse>(R.precipitation, queryParams);
  }

  return getJson<StiplesResponse>(R.airPollution, queryParams);
};
