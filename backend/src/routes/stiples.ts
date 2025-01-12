import express, { Request, Response, Router } from "express";
import pool from "../config/db";
import {
  QueryParams,
  ValidatedParams,
  ValidationResult,
  StipplesRow,
  Stipple,
  PostgresError,
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
  if (
    numParams.w <= 0 ||
    numParams.h <= 0 ||
    numParams.w * numParams.h > 10_000
  ) {
    return {
      isValid: false,
      error:
        "Invalid dimensions. Width and height must be positive and w*h must not exceed 10000",
    };
  }

  return { isValid: true, params: numParams };
};

router.get("/stiples/air_pollution", async (req: Request, res: Response) => {
  try {
    const validation = validateQueryParams(req.query as Partial<QueryParams>);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { minLat, maxLat, minLng, maxLng, w, h, total_stiples } =
      validation.params;

    const totalPoints = total_stiples || 10_000;
    const aspectRatio = h / w;
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
        ST_Value(rast, point) AS val
      FROM
        generated_points
      LEFT JOIN
        air_pollution
      ON
        ST_Intersects(rast, point)
    )
    SELECT lat, lng, val
    FROM sample_points
    ORDER BY lat DESC, lng ASC
  `;

    const result = await pool.query<StipplesRow & { rn: number }>(query, [
      minLng,
      minLat,
      maxLng,
      maxLat,
      total_points_needed,
    ]);

    console.log("Query result length:", result.rows.length);
    const values = result.rows.map((row) => Number(row.val));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    console.log("Query results range of values:", { minValue, maxValue });

    // Create w arrays (width) with h elements (height) each
    const stiples: Stipple[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    console.log("Stipples size:", rows * cols);

    result.rows.forEach((row, index) => {
      const rowIdx = Math.floor(index / cols);
      const colIdx = index % cols;

      if (rowIdx < rows && colIdx < cols) {
        stiples[rowIdx][colIdx] = {
          lat: Number(Number.parseFloat(row.lat).toFixed(4)),
          lng: Number(Number.parseFloat(row.lng).toFixed(4)),
          val:
            row.val !== null
              ? Number(Number.parseFloat(row.val).toFixed(4))
              : 0,
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
