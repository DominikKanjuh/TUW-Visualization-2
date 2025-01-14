/**
 * @fileoverview Stipple class for point-based visualization and density mapping
 * @module frontend/Stippling/Stipple
 */

import * as d3 from "d3";
import { DensityFunction2D } from "./DensityFunction2D";
import { Circle, CircleHelper } from "./Circle";
import { BufferHandler } from "./BufferHandler";
import { ProgressBar } from "../ProgressBar";
import { Voronoi } from "d3";
import { FromWorkerMessage } from "./WorkerTypes";

/**
 * Represents a single stipple point with position, density, and size
 * @class Stipple
 */
export class Stipple {
  /** X coordinate in world space */
  x: number;
  /** Y coordinate in world space */
  y: number;

  /** Relative X position (normalized) */
  relativeX: number;
  /** Relative Y position (normalized) */
  relativeY: number;

  /** Density value at this point */
  density: number;
  /** Radius of the stipple point */
  radius: number;

  /** Debug information display element */
  static stippleDebugDiv = document.getElementById(
    "stipple-debug"
  ) as HTMLDivElement;

  /** Progress bar element */
  static progress_bar = document.getElementById(
    "progress-bar"
  ) as HTMLDivElement;
  /** Progress bar instance */
  static progressBar = new ProgressBar(Stipple.progress_bar);

  /** Maximum number of iterations for stipple placement */
  static maxIterations = 100;

  /**
   * Creates a new stipple point
   * @constructor
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} [density=0.5] - Initial density value
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
   * Updates the position of the stipple
   * @param {number} x - New X coordinate
   * @param {number} y - New Y coordinate
   */
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Creates an array of randomly positioned stipples
   * @static
   * @param {number} numStipples - Number of stipples to create
   * @param {number} maxX - Maximum X coordinate
   * @param {number} maxY - Maximum Y coordinate
   * @param {Function} [sampler=d3.randomUniform] - Random number generator
   * @returns {Stipple[]} Array of randomly positioned stipples
   */
  static createRandomStipples(
    numStipples: number,
    maxX: number,
    maxY: number,
    sampler = d3.randomUniform
  ): Stipple[] {
    const stipples: Stipple[] = [];
    const xSampler = sampler(0, maxX);
    const ySampler = sampler(0, maxY);

    for (let i = 0; i < numStipples; i++) {
      stipples.push(new Stipple(xSampler(), ySampler()));
    }
    return stipples;
  }

  /**
   * Converts an array of stipples to circles for rendering
   * @static
   * @param {Stipple[]} stipples - Array of stipples to convert
   * @returns {Circle[]} Array of circles for rendering
   */
  static stipplesToCircles(stipples: Stipple[]): Circle[] {
    return stipples.map((s) => {
      return {
        density: s.density,
        offset: [s.x, s.y],
        radius: s.radius,
      } as Circle;
    });
  }

  /**
   * Processes density function with a web worker for stipple placement
   * @static
   * @async
   * @param {DensityFunction2D} densityFunction - Density function to process
   * @param {number} [initialStippleRadius=2.0] - Initial radius for stipples
   * @param {number} [initialErrorThreshold=0.0] - Initial error threshold
   * @param {number} [thresholdConvergenceRate=0.01] - Rate of convergence
   * @param {number} [max_iter=100] - Maximum iterations
   * @param {BufferHandler} [bufferHandler=null] - Optional buffer handler for updates
   * @returns {Promise<{stipples: Stipple[], voronoi: Voronoi<number>}>} Final stipple positions and Voronoi diagram
   */
  static async stippleDensityFunctionWithWorker(
    densityFunction: DensityFunction2D,
    initialStippleRadius: number = 2.0,
    initialErrorThreshold: number = 0.0,
    thresholdConvergenceRate = 0.01,
    max_iter: number = 100,
    bufferHandler: BufferHandler | null = null
  ): Promise<{ stipples: Stipple[]; voronoi: Voronoi<number> }> {
    const worker = new Worker(
      new URL("./stippleWorker.worker", import.meta.url)
    );

    worker.postMessage({
      densityFunction: densityFunction,
      initialStippleRadius: initialStippleRadius,
      initialErrorThreshold: initialErrorThreshold,
      thresholdConvergenceRate: thresholdConvergenceRate,
      maxIterations: max_iter,
    });

    return new Promise((resolve, reject) => {
      worker.onmessage = (e: any) => {
        const data = e.data as FromWorkerMessage;
        const { progress, done, iteration, stipples, voronoi } = data;

        if (done) {
          console.log("Stippling done", data);
          Stipple.progressBar.setProgress(100);
          worker.terminate();
          resolve({ stipples, voronoi });
        } else {
          Stipple.progressBar.setProgress(progress);
          this.stippleDebugDiv.innerText = `Iteration: ${iteration}, Stipples: ${stipples.length}`;
          if (bufferHandler && stipples.length < 6000) {
            bufferHandler.exchange_data(
              CircleHelper.circlesToBuffers(Stipple.stipplesToCircles(stipples))
            );
          }
        }
      };
    });
  }

  /**
   * Splits a Voronoi cell into two new points
   * @static
   * @param {Array<[number, number]>} cell - Voronoi cell vertices
   * @returns {{cell1: [number, number], cell2: [number, number]}} Two new points for cell division
   */
  static splitCell(cell: Array<[number, number]>) {
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
}

/**
 * Container class for managing multiple stipples
 * @class Stippling
 */
export class Stippling {
  /** Array of stipple points */
  stipples: Stipple[];

  /**
   * Creates a new stippling container
   * @constructor
   * @param {Stipple[]} stipples - Array of stipples to manage
   */
  constructor(stipples: Stipple[]) {
    this.stipples = stipples;
  }
}
