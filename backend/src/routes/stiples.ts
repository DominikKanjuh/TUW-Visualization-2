import express, { Request, Response, Router } from "express";
import pool from "../config/db";
import {
  QueryParams,
  ValidatedParams,
  ValidationResult,
  StiplesRow,
  Stiple,
  PostgresError,
} from "./interfaces";

const router: Router = express.Router();

const validateQueryParams = (
  params: Partial<QueryParams>
): ValidationResult => {
  const { minLat, maxLat, minLng, maxLng, w, h } = params;

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
  if (
    numParams.w <= 0 ||
    numParams.h <= 0 ||
    numParams.w * numParams.h > 10000
  ) {
    return {
      isValid: false,
      error:
        "Invalid dimensions. Width and height must be positive and w*h must not exceed 10000",
    };
  }

  return { isValid: true, params: numParams };
};

router.get("/stiples", async (req: Request, res: Response) => {
  try {
    const validation = validateQueryParams(req.query as Partial<QueryParams>);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { minLat, maxLat, minLng, maxLng, w, h } = validation.params;
    const totalPoints = w * h;

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
          ST_Value(rast, point) AS val,
          ROW_NUMBER() OVER (
            ORDER BY
              ST_Y(point) DESC,  -- Top to bottom (highest latitude first)
              ST_X(point) ASC    -- Left to right (lowest longitude first)
          ) as rn
        FROM
          generated_points,
          air_pollution
        WHERE
          ST_Intersects(rast, point)
          AND ST_Value(rast, point) IS NOT NULL
        LIMIT $5
      )
      SELECT lat, lng, val, rn
      FROM sample_points
      ORDER BY rn
    `;

    const result = await pool.query<StiplesRow & { rn: number }>(query, [
      minLng,
      minLat,
      maxLng,
      maxLat,
      totalPoints,
    ]);

    // Create w arrays (width) with h elements (height) each
    const stiples: Stiple[][] = Array(w)
      .fill(null)
      .map(() => Array(h).fill(null));

    result.rows.forEach((row) => {
      const rn = row.rn - 1; // Convert to 0-based index
      const gridW = Math.floor(rn / h); // Column (array) index
      const gridH = rn % h; // Row (element) index

      if (gridW < w && gridH < h) {
        stiples[gridW][gridH] = {
          lat: Number.parseFloat(row.lat),
          lng: Number.parseFloat(row.lng),
          val: Number.parseFloat(row.val),
        };
      }
    });

    res.json({ stiples });
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
