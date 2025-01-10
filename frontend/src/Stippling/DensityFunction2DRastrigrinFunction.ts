import {DensityFunction2D} from "./DensityFunction2D";

export class DensityFunction2DRastrigrinFunction extends DensityFunction2D {
    constructor(width: number, height: number) {
        const data = new Array(height).fill(0).map((_, y) => {
            return new Array(width).fill(0).map((_, x) => {
                const xScaled = x / width * 100;
                const yScaled = y / height * 100;
                return 20 + xScaled * xScaled - 10 * Math.cos(2 * Math.PI * xScaled) + yScaled * yScaled - 10 * Math.cos(2 * Math.PI * yScaled);
            });
        });
        super(data);
    }
}