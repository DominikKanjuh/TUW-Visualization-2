import express, { Request, Response, Router } from "express";
import pool from "../config/db";
import {
  QueryParams,
  ValidatedParams,
  ValidationResult,
  StipplesRow,
  Stipple,
  PostgresError,
  DatasetType,
  DATASET_CONFIGS,
} from "./interfaces";

const router: Router = express.Router();

const validateQueryParams = (
  params: Partial<QueryParams>
): ValidationResult => {
  const { minLat, maxLat, minLng, maxLng, w, h, total_stiples } = params;

  if (!minLat || !maxLat || !minLng || !maxLng || !w || !h) {
    return {
      isValid: false,
      error:
        "Missing required parameters: minLat, maxLat, minLng, maxLng, w, h",
    };
  }

  const numParams: ValidatedParams = {
    minLat: Number.parseFloat(minLat),
    maxLat: Number.parseFloat(maxLat),
    minLng: Number.parseFloat(minLng),
    maxLng: Number.parseFloat(maxLng),
    w: Number.parseInt(w),
    h: Number.parseInt(h),
    total_stiples: total_stiples ? Number.parseInt(total_stiples) : undefined,
  };

  // Validate latitude range (-90 to 90)
  if (
    numParams.minLat < -90 ||
    numParams.maxLat > 90 ||
    numParams.minLat > numParams.maxLat
  ) {
    return {
      isValid: false,
      error:
        "Invalid latitude range. Must be between -90 and 90, and minLat must be less than maxLat",
    };
  }

  // Validate longitude range (-180 to 180)
  if (
    numParams.minLng < -180 ||
    numParams.maxLng > 180 ||
    numParams.minLng > numParams.maxLng
  ) {
    return {
      isValid: false,
      error:
        "Invalid longitude range. Must be between -180 and 180, and minLng must be less than maxLng",
    };
  }

  // Validate width and height dimensions
  if (numParams.w <= 0 || numParams.h <= 0) {
    return {
      isValid: false,
      error:
        "Invalid dimensions. Width and height must be positive and w*h must not exceed 10000",
    };
  }

  return { isValid: true, params: numParams };
};

const assignPointsToGrid = (
  stipples: StipplesRow[],
  w: number,
  h: number,
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number
): Stipple[][] => {
  const cellWidth = (maxLng - minLng) / w;
  const cellHeight = (maxLat - minLat) / h;

  // w x h grid
  const grid: Stipple[][] = Array.from({ length: h }, () =>
    Array(w).fill(null)
  );

  //  assign the closest point to uniform grid cells
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      // centar of the current grid cell
      const cellCenterLng = minLng + col * cellWidth + cellWidth / 2;
      const cellCenterLat = maxLat - row * cellHeight - cellHeight / 2;

      let closestPoint: Stipple | null = null;
      let closestDistance = Infinity;

      stipples.forEach((stipple) => {
        const distance = Math.sqrt(
          Math.pow(parseFloat(stipple.lng) - cellCenterLng, 2) +
            Math.pow(parseFloat(stipple.lat) - cellCenterLat, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = {
            lat: parseFloat(stipple.lat),
            lng: parseFloat(stipple.lng),
            val: stipple.val !== null ? parseFloat(stipple.val) : 0, //  null to 0
          };
        }
      });

      if (closestPoint) {
        grid[row][col] = {
          //@ts-ignore
          lat: closestPoint.lat,
          //@ts-ignore
          lng: closestPoint.lng,
          //@ts-ignore
          val: closestPoint.val,
        };
      }
    }
  }

  return grid;
};

const getStiplesForDataset = async (
  dataset: DatasetType,
  params: ValidatedParams,
  res: Response
) => {
  const { tableName, valueColumn } = DATASET_CONFIGS[dataset];
  const { minLat, maxLat, minLng, maxLng, w, h, total_stiples } = params;

  const totalPoints = total_stiples || 10_000;
  const aspectRatio = w / h;
  const cols = Math.round(Math.sqrt(totalPoints * aspectRatio));
  const rows = Math.ceil(totalPoints / cols);
  const total_points_needed = rows * cols;

  const query = `
    WITH bounds AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom
    ),
    generated_points AS (
      SELECT (ST_Dump(ST_GeneratePoints(bounds.geom, $5))).geom AS point
      FROM bounds
    ),
    sample_points AS (
      SELECT
        ST_X(point) AS lng,
        ST_Y(point) AS lat,
        ST_Value(${valueColumn}, point) AS val
      FROM
        generated_points
      LEFT JOIN
        ${tableName}
      ON
        ST_Intersects(${valueColumn}, point)
    )
    SELECT lat, lng, val
    FROM sample_points
    ORDER BY lat DESC, lng ASC
  `;

  try {
    const result = await pool.query<StipplesRow & { rn: number }>(query, [
      minLng,
      minLat,
      maxLng,
      maxLat,
      total_points_needed,
    ]);
    console.log("Raw stipples from the database:", result.rows);

    console.log("Query result length:", result.rows.length);

    const grid = assignPointsToGrid(
      result.rows,
      w,
      h,
      minLng,
      maxLng,
      minLat,
      maxLat
    );

    res.json({ stiples: grid });
  } catch (error) {
    console.error("Error in /stiples endpoint:", error);

    const pgError = error as PostgresError;

    if (pgError.code === "42P01") {
      return res.status(500).json({
        error:
          "Table not found. Please ensure the air_pollution table exists in the database.",
      });
    }

    if (pgError.code === "28P01") {
      return res.status(500).json({
        error: "Database authentication failed. Please check your credentials.",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred while processing your request.",
    });
  }
};

router.get("/stiples/air_pollution", async (req: Request, res: Response) => {
  const validation = validateQueryParams(req.query as Partial<QueryParams>);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }
  await getStiplesForDataset("air_pollution", validation.params, res);
});

router.get("/stiples/temperature", async (req: Request, res: Response) => {
  const validation = validateQueryParams(req.query as Partial<QueryParams>);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }
  await getStiplesForDataset("temperature", validation.params, res);
});

router.get("/stiples/earth_relief", async (req: Request, res: Response) => {
  const validation = validateQueryParams(req.query as Partial<QueryParams>);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }
  await getStiplesForDataset("earth_relief", validation.params, res);
});

router.get("/stiples/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    const pgError = error as PostgresError;
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: pgError.message,
    });
  }
});

export default router;
