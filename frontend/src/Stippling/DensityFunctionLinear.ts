/**
 * @fileoverview Implementation of a linear gradient density function
 * @module frontend/Stippling/DensityFunctionLinear
 */

import { DensityFunction2D } from "./DensityFunction2D";

/**
 * A linear density function that creates a horizontal gradient
 * Density increases linearly from left to right (0 to 100)
 * Top to bottom is uniform
 * @class DensityFunctionLinear
 * @extends DensityFunction2D
 */
export class DensityFunctionLinear extends DensityFunction2D {
  /**
   * Creates a new linear gradient density function
   * @constructor
   * @param {number} width - Width of the density grid
   * @param {number} height - Height of the density grid
   */
  constructor(width: number, height: number) {
    // Generate the density grid using a linear gradient
    const data = new Array(height).fill(0).map((_, y) => {
      return new Array(width).fill(0).map((_, x) => {
        // Linear interpolation from left (0) to right (100)
        return (x / width) * 100;
      });
    });

    // Initialize parent class with generated data
    super(data);
  }
}
