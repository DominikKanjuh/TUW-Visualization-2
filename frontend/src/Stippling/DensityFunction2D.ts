import d3 from 'd3';

export class DensityFunction2D {
    /**
     * A 2D density function.
     * @param data A 2D array of numbers.
     * @param width The width of the density function.
     * @param height The height of the density function.
     */

    // The density function is a 2D array of numbers.
    data: number[][];
    // The width of the density function.
    width: number;
    // The height of the density function.
    height: number;

    /**
     * Create a new DensityFunction2D object.
     * @param data Can be a DensityFunction2D object or a 2D array of numbers.
     */
    constructor(data: DensityFunction2D | number[][]) {
        if (data instanceof DensityFunction2D) {
            this.data = data.data;
            this.width = data.width;
            this.height = data.height;
        } else {
            this.data = data;
            this.width = data.length;
            this.height = data[0].length;
        }
    }


    /**
     * Get the density at a given point.
     * @param x
     * @param y
     */
    densityAt(x: number, y: number): number {
        return this.data[y][x];
    }

    densityInPolygon(polygon: Array<[number, number]>): number {
        let sum = 0;
        const x_cords = polygon.map((point) => point[0]);
        const y_cords = polygon.map((point) => point[1]);

        const x_min = Math.min(...x_cords);
        const x_max = Math.max(...x_cords);
        const y_min = Math.min(...y_cords);
        const y_max = Math.max(...y_cords);

        for (let x = x_min; x < x_max; x++) {
            for (let y = y_min; y < y_max; y++) {
                if (d3.polygonContains(polygon, [x, y])) {
                    sum += this.data[y][x];
                }
            }
        }

        return sum;
    }


}