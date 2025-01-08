import {DensityFunction2D} from "./Stippling/DensityFunction2D";

/**
 * A linear density function going from 0 to 1 from left to right.
 * Top to bottom is 0 to 1 uniformly.
 */
export class DensityFunctionLinear extends DensityFunction2D {
    constructor(width: number, height: number) {
        const data = new Array(height).fill(0).map((_, y) => {
            return new Array(width).fill(0).map((_, x) => {
                return x / width;
            });
        });
        super(data);
    }
}