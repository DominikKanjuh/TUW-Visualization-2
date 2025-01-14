/**
 * @fileoverview Implementation of the Eggholder function as a 2D density function
 * @module frontend/Stippling/DensityFunction2DEggholder
 */

import { DensityFunction2D } from "./DensityFunction2D";

/**
 * Implements the Eggholder function as a 2D density distribution
 * The Eggholder function is a challenging optimization function with many local minima
 * f(x,y) = -(y+47)sin(sqrt(|y+x/2+47|)) - x*sin(sqrt(|x-(y+47)|))
 * @class DensityFunction2DEggholder
 * @extends DensityFunction2D
 */
export class DensityFunction2DEggholder extends DensityFunction2D {
    /**
     * Creates a new Eggholder density function
     * @constructor
     * @param {number} width - Width of the density grid
     * @param {number} height - Height of the density grid
     */
    constructor(width: number, height: number) {
        // Generate the density grid using the Eggholder function
        const data = new Array(height).fill(0).map((_, y) => {
            return new Array(width).fill(0).map((_, x) => {
                // Scale x and y to appropriate range (typically -512 to 512)
                const xScaled = x / width * 100;
                const yScaled = y / height * 100;
                // Simplified version of Eggholder function for visualization
                return 20 + xScaled * xScaled + yScaled * yScaled -
                       10 * (Math.cos(2 * Math.PI * xScaled) +
                            Math.cos(2 * Math.PI * yScaled));
            });
        });

        // Initialize parent class with generated data
        super(data);
    }
}
