/**
 * @fileoverview 2D density function implementation for stipple generation
 * @module frontend/Stippling/DensityFunction2D
 */

import * as d3 from "d3";
import { Stipple } from "./Stipple";
import { Voronoi } from "d3";
import { Util } from "../util";

/**
 * Represents a 2D density function for stipple distribution
 * Handles density calculations, normalization, and Voronoi cell assignments
 * @class DensityFunction2D
 */
export class DensityFunction2D {
  /** 2D array of density values */
  data: number[][];
  /** Width of the density function grid */
  width: number;
  /** Height of the density function grid */
  height: number;

  /**
   * Creates a new DensityFunction2D instance
   * @constructor
   * @param {DensityFunction2D | number[][]} data - Either an existing DensityFunction2D or a 2D array of density values
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

    // Normalize the density values to [0,1] range
    this.normalize();
  }

  /**
   * Normalizes density values to range [0,1]
   * @private
   */
  normalize() {
    const { min, max } = Util.minMaxOfArray2D(this.data);
    const range = max - min;
    this.data = this.data.map((row) => row.map((d) => (d - min) / range));
  }

  /**
   * Gets density value at specific coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Density value at (x,y)
   */
  densityAt(x: number, y: number): number {
    return this.data[x][y];
  }

  /**
   * Calculates total density within a polygon
   * @param {Array<[number, number]>} polygon - Array of polygon vertices
   * @returns {number} Total density within polygon
   */
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

  /**
   * Gets bounding box of a polygon
   * @param {Array<[number, number]>} polygon - Array of polygon vertices
   * @returns {Object} Bounding box coordinates
   */
  getBoundingBoxOfPolygon(polygon: Array<[number, number]>): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
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
    return { minX, maxX, minY, maxY };
  }

  /**
   * Assigns density values to stipples based on their Voronoi cells
   * @param {Stipple[]} stipples - Array of stipples
   * @param {Voronoi<Stipple>} voronoi - Voronoi diagram
   * @returns {Stipple[]} Updated stipples with assigned densities
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
      const xs = cell.map((point) => point[0]);
      const ys = cell.map((point) => point[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      // Iterate through pixels in Voronoi cell
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

      stipple.density = totalDensity;
      return stipple;
    });
  }

  /**
   * Creates a quantization of the range [0, 1]
   * @param {number} num - Number of quantization steps
   * @returns {number[]} Array of quantization values
   * @static
   */
  static createQuantisation(num: number) {
    const quantisation = [];
    for (let i = 0; i < num; i++) {
      quantisation.push(i / num);
    }
    return quantisation;
  }

  /**
   * Quantizes an array of numbers using given quantization levels
   * @param {number[]} array - Array to quantize
   * @param {number[]} quantisation - Quantization levels
   * @returns {number[]} Quantized array
   * @static
   */
  static quantise(array: number[], quantisation: number[]) {
    return array.map((p) => {
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

  /**
   * Creates a Mach banding effect on the density function
   * @param {number[]} [quantisation] - Quantization levels
   * @param {number} [weight=0.5] - Blending weight
   * @param {number} [blurRadius=4] - Blur radius
   * @returns {DensityFunction2D} New density function with Mach banding
   */
  public createMachBanding2D(
    quantisation: number[] = DensityFunction2D.createQuantisation(5),
    weight = 0.5,
    blurRadius = 4
  ): DensityFunction2D {
    const quantisedData = this.data.map((row) =>
      DensityFunction2D.quantise(row, quantisation)
    );
    const blurSize = Math.pow(blurRadius, 2.0) * Math.PI;
    const imageData = this.float2DtoImage(quantisedData);

    const offscreenCanvas = new OffscreenCanvas(
      imageData.width,
      imageData.height
    );
    const blurringContext = offscreenCanvas.getContext("2d")!;
    blurringContext.putImageData(imageData, 0, 0);
    blurringContext.filter = `blur(${blurSize}px)`;
    blurringContext.drawImage(offscreenCanvas, 0, 0);
    const blurredImage = blurringContext.getImageData(
      0,
      0,
      imageData.width,
      imageData.height
    );
    const blurredData = this.image2DtoFloat(blurredImage);

    const machBanded = [];
    for (let i = 0; i < imageData.width * imageData.height; ++i) {
      machBanded.push(
        Math.min(
          1,
          Math.max(
            0,
            weight * blurredData[i] + (1 - weight) * quantisedData.flat()[i]
          )
        )
      );
    }

    // Convert back to 2D array
    const machBanded2D = [];
    for (let i = 0; i < imageData.height; i++) {
      machBanded2D.push(
        machBanded.slice(i * imageData.width, (i + 1) * imageData.width)
      );
    }

    return new DensityFunction2D(machBanded2D);
  }

  /**
   * Converts 2D float array to ImageData
   * @param {number[][]} data - 2D array of float values
   * @returns {ImageData} Converted image data
   */
  public float2DtoImage(data: number[][]): ImageData {
    return new ImageData(
      new Uint8ClampedArray(data.flat().map((v) => v * 255)),
      data.length,
      data[0].length
    );
  }

  /**
   * Converts ImageData to float array
   * @param {ImageData} imageData - Image data to convert
   * @returns {number[]} Array of float values
   */
  public image2DtoFloat(imageData: ImageData): number[] {
    const data = imageData.data;
    const floatData = [];
    for (let i = 0; i < data.length; i += 4) {
      floatData.push(data[i] / 255);
    }
    return floatData;
  }
}
