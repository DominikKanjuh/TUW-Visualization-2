/**
 * @fileoverview Web Worker implementation for stipple generation and distribution
 * @module frontend/Stippling/stippleWorker
 */

import { DensityFunction2D } from "./DensityFunction2D";
import * as d3 from "d3";
import { FromWorkerMessage, ToWorkerMessage } from "./WorkerTypes";
import { Voronoi } from "d3";

/** Worker context */
const ctx: Worker = self as any;

/**
 * Worker message handler
 * Processes density function and generates stipples
 * @param {MessageEvent} event - Worker message event containing stippling parameters
 */
ctx.onmessage = async function (event) {
  const {
    densityFunction,
    initialStippleRadius,
    initialErrorThreshold,
    thresholdConvergenceRate,
    maxIterations,
  } = event.data as ToWorkerMessage;

  console.log("Worker received data", event.data);

  const workerDensityFunction = new DensityFunction2D(densityFunction.data);

  await stippleDensityFunction(
    workerDensityFunction,
    initialStippleRadius,
    initialErrorThreshold,
    thresholdConvergenceRate,
    maxIterations
  );
};

/**
 * Main stippling algorithm
 * Iteratively places and adjusts stipples based on density function
 * @async
 * @param {DensityFunction2D} densityFunction - Target density function
 * @param {number} initialStippleRadius - Starting radius for stipples
 * @param {number} initialErrorThreshold - Initial error tolerance
 * @param {number} thresholdConvergenceRate - Rate of error threshold increase
 * @param {number} maxIterations - Maximum number of iterations
 */
async function stippleDensityFunction(
  densityFunction: DensityFunction2D,
  initialStippleRadius: number,
  initialErrorThreshold: number,
  thresholdConvergenceRate: number,
  maxIterations: number
): Promise<void> {
  // Initialize stipples
  const stippleArea = Math.pow(initialStippleRadius, 2) * Math.PI;
  const numOfInitialStipples = Math.round(
    ((densityFunction.width * densityFunction.height) / stippleArea) * 0.7
  );

  let stipples = createRandomStipples(
    numOfInitialStipples,
    densityFunction.width,
    densityFunction.height
  );

  // * Loop until convergence
  let lastVoronoi = null;
  let errorThreshold = initialErrorThreshold;
  let splitOrMerge_happened = false;
  let iteration = 0;

  do {
    splitOrMerge_happened = false;
    // Create Voronoi diagram
    const voronoi = d3.Delaunay.from(stipples.map((s) => [s.x, s.y])).voronoi([
      0,
      0,
      densityFunction.width,
      densityFunction.height,
    ]);

    stipples = densityFunction.assignDensity(
      stipples,
      voronoi
    ) as WorkerStipple[];

    // Handle stipple changes (splitting/merging)
    const change = handleStippleChange(
      stipples,
      voronoi,
      stippleArea,
      errorThreshold
    );
    splitOrMerge_happened = change.change;
    stipples = change.new_stipples;
    lastVoronoi = voronoi;

    // Send progress update
    ctx.postMessage({
      progress: (iteration / maxIterations) * 100,
      done: false,
      iteration,
      stipples: fillStippleProperties(stipples, densityFunction),
      voronoi: lastVoronoi,
    } as FromWorkerMessage);

    errorThreshold += thresholdConvergenceRate;
    iteration++;
  } while (splitOrMerge_happened && iteration < maxIterations);

  // Send final result
  ctx.postMessage({
    progress: 100,
    done: true,
    iteration,
    stipples: fillStippleProperties(stipples, densityFunction),
    voronoi: lastVoronoi,
  } as FromWorkerMessage);
}

/**
 * Handles stipple changes based on density thresholds
 * @param {WorkerStipple[]} stipples - Current stipples
 * @param {Voronoi<number>} voronoi - Current Voronoi diagram
 * @param {number} area - Target area per stipple
 * @param {number} error - Error threshold
 * @returns {{change: boolean, new_stipples: WorkerStipple[]}} Change status and updated stipples
 */
function handleStippleChange(
  stipples: WorkerStipple[],
  voronoi: Voronoi<number>,
  area: number,
  error: number
): { change: boolean; new_stipples: WorkerStipple[] } {
  let new_stipples: WorkerStipple[] = [];
  let change = false;

  const deleteThreshold = area - error;
  const splitThreshold = area + error;

  for (let i = 0; i < stipples.length; ++i) {
    const s = stipples[i];
    const cell = d3.polygonHull(voronoi.cellPolygon(i))!;
    if (s.density < deleteThreshold) {
      change = true;
    } else if (s.density > splitThreshold) {
      change = true;
      const { cell1, cell2 } = splitCell(cell);
      s.setPosition(cell1[0], cell1[1]);
      new_stipples.push(s);
      new_stipples.push(new WorkerStipple(cell2[0], cell2[1]));
    } else {
      s.setPosition(...d3.polygonCentroid(cell));
      new_stipples.push(s);
    }
  }

  return { change, new_stipples };
}

/**
 * Normalizes stipple properties for visualization
 * @param {WorkerStipple[]} stipples - Stipples to process
 * @param {DensityFunction2D} densityFunction - Reference density function
 * @returns {WorkerStipple[]} Processed stipples with normalized properties
 */
function fillStippleProperties(
  stipples: WorkerStipple[],
  densityFunction: DensityFunction2D
): WorkerStipple[] {
  const maxDensity = Math.max(...stipples.map((s) => s.density));
  const minDensity = Math.min(...stipples.map((s) => s.density));

  stipples.map((s) => {
    s.density = (s.density - minDensity) / (maxDensity - minDensity);
    s.relativeX = s.x / densityFunction.width;
    s.relativeY = s.y / densityFunction.height;
  });

  return stipples;
}

/**
 * Creates random stipples within bounds
 * @param {number} numStipples - Number of stipples to create
 * @param {number} maxX - Maximum X coordinate
 * @param {number} maxY - Maximum Y coordinate
 * @param {Function} [sampler=d3.randomUniform] - Random number generator
 * @returns {WorkerStipple[]} Array of randomly positioned stipples
 */
function createRandomStipples(
  numStipples: number,
  maxX: number,
  maxY: number,
  sampler = d3.randomUniform
): WorkerStipple[] {
  const stipples: WorkerStipple[] = [];
  const xSampler = sampler(0, maxX);
  const ySampler = sampler(0, maxY);

  for (let i = 0; i < numStipples; i++) {
    stipples.push(new WorkerStipple(xSampler(), ySampler()));
  }
  return stipples;
}

/**
 * Splits a Voronoi cell into two points
 * @param {Array<[number, number]>} cell - Cell vertices
 * @returns {{cell1: [number, number], cell2: [number, number]}} Two new points
 */
function splitCell(cell: Array<[number, number]>) {
  const centroid = d3.polygonCentroid(cell);
  let largestDir = [0, 0];
  let secondLargestDir = [0, 0];
  let largestDistance = 0;
  let secondLargestDistance = 0;

  for (const p of cell) {
    const direction = [p[0] - centroid[0], p[1] - centroid[1]];
    const squaredDistance = direction.reduce(
      (acc, c) => acc + Math.pow(c, 2),
      0
    );
    if (squaredDistance > largestDistance) {
      secondLargestDistance = largestDistance;
      secondLargestDir = largestDir;
      largestDistance = squaredDistance;
      largestDir = direction;
    }
  }
  return {
    cell1: [
      centroid[0] + largestDir[0] * 0.5,
      centroid[1] + largestDir[1] * 0.5,
    ],
    cell2: [
      centroid[0] + secondLargestDir[0] * 0.5,
      centroid[1] + secondLargestDir[1] * 0.5,
    ],
  };
}

/**
 * Worker-specific stipple class
 * @class WorkerStipple
 */
class WorkerStipple {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
  density: number;
  radius: number;

  static maxIterations = 100;

  /**
   * Creates a new worker stipple
   * @constructor
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} [density=0.5] - Initial density
   * @param {number} [radius=0.5] - Initial radius
   */
  constructor(
    x: number,
    y: number,
    density: number = 0.5,
    radius: number = 0.5
  ) {
    this.x = x;
    this.y = y;
    this.relativeX = 0;
    this.relativeY = 0;
    this.density = density;
    this.radius = radius;
  }

  /**
   * Updates stipple position
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   */
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Gets current position
   * @returns {number[]} [x, y] coordinates
   */
  position(): number[] {
    return [this.x, this.y];
  }
}
