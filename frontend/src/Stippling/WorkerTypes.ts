/**
 * @fileoverview Type definitions for Web Worker messages in stippling process
 * @module frontend/Stippling/WorkerTypes
 */

import { DensityFunction2D } from "./DensityFunction2D";
import { Stipple } from "./Stipple";

/**
 * Message type sent to the Web Worker to initiate stippling
 * @interface ToWorkerMessage
 */
export type ToWorkerMessage = {
  /** Density function to process */
  densityFunction: DensityFunction2D;
  /** Initial radius for stipple points */
  initialStippleRadius: number;
  /** Initial error threshold for convergence */
  initialErrorThreshold: number;
  /** Rate at which threshold converges */
  thresholdConvergenceRate: number;
  /** Maximum number of iterations */
  maxIterations: number;
};

/**
 * Message type received from the Web Worker during/after stippling
 * @interface FromWorkerMessage
 */
export type FromWorkerMessage = {
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether processing is complete */
  done: boolean;
  /** Current iteration number */
  iteration: number;
  /** Current array of stipple points */
  stipples: Stipple[];
  /** Current Voronoi diagram */
  voronoi: d3.Voronoi<number>;
};
