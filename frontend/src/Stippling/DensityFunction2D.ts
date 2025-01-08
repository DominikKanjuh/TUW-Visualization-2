import * as d3 from 'd3'
import {Stipple} from "./Stipple";

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
        x = Math.floor(x);
        y = Math.floor(y);
        try {
            return this.data[x][y];
        } catch (e) {
            console.log(x, y, this.width, this.height);
            throw e;
        }
    }

    densityInPolygon(polygon: Array<[number, number]>): number {
        let sum = 0;
        const x_cords = polygon.map((point) => point[0]);
        const y_cords = polygon.map((point) => point[1]);

        const x_min = Math.min(...x_cords);
        const x_max = Math.max(...x_cords);
        const y_min = Math.min(...y_cords);
        const y_max = Math.max(...y_cords);

        for (let x = x_min; x < Math.max(x_max, this.height); x++) {
            for (let y = y_min; y < Math.max(y_max, this.width); y++) {
                if (d3.polygonContains(polygon, [x, y])) {
                    sum += this.densityAt(x, y);
                }
            }
        }

        return sum;
    }

    // assignDensity(stipples: Stipple[], voronoi: d3.Voronoi<number>) {
    //     // 0 out the density of all stipples
    //     stipples.forEach(s => s.density = 0);
    //
    //     let lastFound = 0;
    //     let lastFoundRow = Array(this.width);
    //     for (let y = 0; y < this.height; ++y) {
    //         for (let x = 0; x < this.width; ++x) {
    //             if (lastFoundRow[x]) {
    //                 lastFound = lastFoundRow[x];
    //             }
    //             lastFound = voronoi.delaunay.find(x, y, lastFound);
    //             lastFoundRow[x] = lastFound;
    //             if (stipples[lastFound] === undefined) {
    //                 console.log("undefined")
    //             } else {
    //                 stipples[lastFound].density += this.densityAt(x, y);
    //             }
    //         }
    //     }
    //     return stipples;
    // }

    assignDensity(stipples: Stipple[], voronoi: d3.Voronoi<number>) {
        for (let i = 0; i < stipples.length; i++) {
            const s = stipples[i];
            let cell = d3.polygonHull(voronoi.cellPolygon(i));
            if (!cell) {
                console.error("No cell found for stipple", s);
                cell = [[s.x, s.y]];
            }
            s.density = this.densityInPolygon(cell);
        }
        return stipples;
    }
}