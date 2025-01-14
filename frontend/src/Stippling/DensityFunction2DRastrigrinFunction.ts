/**
 * @fileoverview Implementation of the Rastrigin function as a 2D density function
 * @module frontend/Stippling/DensityFunction2DRastrigrinFunction
 */

import { DensityFunction2D } from "./DensityFunction2D";

/**
 * Implements the Rastrigin function as a 2D density distribution
 * The Rastrigin function is a non-convex function used as a performance test problem for optimization algorithms
 * f(x,y) = 20 + x² + y² - 10(cos(2πx) + cos(2πy))
 * @class DensityFunction2DRastrigrinFunction
 * @extends DensityFunction2D
 */
export class DensityFunction2DRastrigrinFunction extends DensityFunction2D {
  /**
   * Creates a new Rastrigin density function
   * @constructor
   * @param {number} width - Width of the density grid
   * @param {number} height - Height of the density grid
   */
  constructor(width: number, height: number) {
    const data = new Array(height).fill(0).map((_, y) => {
      return new Array(width).fill(0).map((_, x) => {
        const xScaled = (x / width) * 100;
        const yScaled = (y / height) * 100;
        return (
          20 +
          xScaled * xScaled -
          10 * Math.cos(2 * Math.PI * xScaled) +
          yScaled * yScaled -
          10 * Math.cos(2 * Math.PI * yScaled)
        );
      });
    });
    super(data);
  }
}
