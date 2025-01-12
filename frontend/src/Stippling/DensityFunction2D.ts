import * as d3 from 'd3'
import {Stipple} from "./Stipple";
import {Voronoi} from "d3";

/**
 * A 2D density function.
 * @param data A 2D array of numbers.
 * @param width The width of the density function.
 * @param height The height of the density function.
 */
export class DensityFunction2D {
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

        // Normalize the data
        this.normalize();
    }

    normalize() {
        const max = Math.max(...this.data.flat());
        const min = Math.min(...this.data.flat());
        const range = max - min;
        this.data = this.data.map(row => row.map(d => (d - min) / range));
    }

    /**
     * Get the density at a given point.
     * @param x
     * @param y
     */
    densityAt(x: number, y: number): number {
        return this.data[x][y];
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

    getBoundingBoxOfPolygon(polygon: Array<[number, number]>): {
        minX: number,
        maxX: number,
        minY: number,
        maxY: number
    } {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < polygon.length; i++) {
            const [x, y] = polygon[i];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        return {minX, maxX, minY, maxY};
    }

    /**
     * Assign density to stipples based on the density function and the Voronoi diagram.
     * @param stipples
     * @param voronoi
     */
    assignDensity(stipples: Stipple[], voronoi: Voronoi<Stipple>): Stipple[] {
        return stipples.map((stipple, i) => {

            const cell = voronoi.cellPolygon(i);

            if (!cell) {
                stipple.density = 0;
                return stipple;
            }

            let totalDensity = 0;
            let totalArea = 0.1;

            // Calculate bounding box manually
            const xs = cell.map(point => point[0]);
            const ys = cell.map(point => point[1]);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            // Iterate through the pixels in the Voronoi cell
            for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
                for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
                    if (d3.polygonContains(cell, [x, y])) {
                        const density = this.densityAt(x, y);
                        if (isNaN(density)) {
                            debugger;
                        }
                        totalDensity += density;
                        totalArea += 1;
                    }
                }
            }

            // stipple.density = totalArea > 0 ? totalDensity / totalArea : 0;
            stipple.density = totalDensity;
            // console.log(stipple.density, totalDensity, totalArea);
            return stipple;
        });
    }


    // Region Mach Banding
    /**
     * Create a quantisation of the range [0, 1] with num steps.
     * @param num
     */
    static createQuantisation(num: number) {
        const quantisation = [];
        for (let i = 0; i < num; i++) {
            quantisation.push(i / num);
        }
        return quantisation;
    }

    /**
     * Quantise an array of numbers with a given quantisation.
     * @param array
     * @param quantisation
     */
    static quantise(array: number[], quantisation: number[]) {
        return array.map(p => {
            for (let i = 0; i < quantisation.length; ++i) {
                if (p < quantisation[i]) {
                    if (i === 0) {
                        return 0;
                    } else {
                        return quantisation[i - 1];
                    }
                }
            }
            return 1.0;
        });
    }

    public createMachBanding2D(quantisation: number[] = DensityFunction2D.createQuantisation(5), weight = 0.5, blurRadius = 4) {
        const quantisedData = this.data.map(row => DensityFunction2D.quantise(row, quantisation));
        const blurSize = Math.pow(blurRadius, 2.0) * Math.PI;
        const imageData = this.float2DtoImage(quantisedData);

        const offscreenCanvas = new OffscreenCanvas(imageData.width, imageData.height);
        const blurringContext = offscreenCanvas.getContext('2d')!;
        blurringContext.putImageData(imageData, 0, 0);
        blurringContext.filter = `blur(${blurSize}px)`;
        blurringContext.drawImage(offscreenCanvas, 0, 0);
        const blurredImage = blurringContext.getImageData(0, 0, imageData.width, imageData.height);
        const blurredData = this.image2DtoFloat(blurredImage);


        const machBanded = [];
        for (let i = 0; i < imageData.width * imageData.height; ++i) {
            machBanded.push(Math.min(1, Math.max(0, weight * blurredData[i] + (1 - weight) * quantisedData.flat()[i], 0, 1)));
        }

        // turn it back into 2d array
        const machBanded2D = [];
        for (let i = 0; i < imageData.height; i++) {
            machBanded2D.push(machBanded.slice(i * imageData.width, (i + 1) * imageData.width));
        }

        return new DensityFunction2D(machBanded2D);
    }

    /**
     * Create image from 2D float array.
     */
    public float2DtoImage(data: number[][]) {
        return new ImageData(
            new Uint8ClampedArray(data.flat().map(v => v * 255)),
            data.length,
            data[0].length
        )
    }

    /**
     * Create a 2D array from an image.
     */
    public image2DtoFloat(imageData: ImageData) {
        const data = imageData.data;
        const floatData = [];
        for (let i = 0; i < data.length; i += 4) {
            floatData.push(data[i] / 255);
        }
        return floatData;
    }
}