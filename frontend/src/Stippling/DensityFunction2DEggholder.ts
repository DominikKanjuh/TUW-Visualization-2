import { Voronoi } from "d3";
import {DensityFunction2D} from "./DensityFunction2D";
import {Stipple} from "./Stipple";

export class DensityFunction2DEggholder extends DensityFunction2D {
    constructor(width: number, height: number) {
        const data = new Array(height).fill(0).map((_, y) => {
            return new Array(width).fill(0).map((_, x) => {
                const xScaled = x / width * 100;
                const yScaled = y / height * 100;
                return 20 + xScaled * xScaled + yScaled * yScaled - 10 * (Math.cos(2 * Math.PI * xScaled) + Math.cos(2 * Math.PI * yScaled));
            });
        });
        console.log("DensityFunction2DEggholder", data);
        super(data);
    }
}