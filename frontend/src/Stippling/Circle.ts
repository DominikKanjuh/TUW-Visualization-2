/**
 * @fileoverview Circle type definitions and helper functions for stipple visualization
 * @module frontend/Stippling/Circle
 */

/**
 * Represents a circle with density, position, and size
 * @interface Circle
 */
export type Circle = {
  /** Density value (1 32-bit float) */
  density: number;
  /** Position offset [x, y] (2 32-bit floats) */
  offset: number[];
  /** Circle radius (1 32-bit float) */
  radius: number;
};

/**
 * Helper class for circle operations and buffer conversions
 * @class CircleHelper
 */
export class CircleHelper {
  /**
   * Converts an array of circles to a WebGPU-compatible buffer
   * Packs circle properties into a single Float32Array in the format:
   * [density, offsetX, offsetY, radius, density, offsetX, offsetY, radius, ...]
   *
   * @param {Circle[]} circles - Array of circles to convert
   * @returns {Float32Array} Packed buffer data for WebGPU
   * @example
   * const circles = [{ density: 0.5, offset: [1, 2], radius: 0.3 }];
   * const buffer = CircleHelper.circlesToBuffers(circles);
   * // buffer = Float32Array([0.5, 1, 2, 0.3])
   */
  static circlesToBuffers(circles: Circle[]): Float32Array {
    const circleBuffer = new Float32Array(circles.length * 4);

    circles.forEach((circle, i) => {
      circleBuffer.set(
        [
          circle.density, // 1 float
          circle.offset[0], // 2 floats for offset
          circle.offset[1],
          circle.radius, // 1 float
        ],
        i * 4
      );
    });

    return circleBuffer;
  }

  /**
   * Creates an array of random circles within specified bounds
   * @param {number} numCircle - Number of circles to create
   * @param {number} maxX - Maximum X coordinate
   * @param {number} maxY - Maximum Y coordinate
   * @param {Function} [sampler=Math.random] - Random number generator function
   * @returns {Circle[]} Array of randomly generated circles
   */
  static createRandomCircles(
    numCircle: number,
    maxX: number,
    maxY: number,
    sampler = Math.random
  ): Circle[] {
    const circles: Circle[] = [];

    for (let i = 0; i < numCircle; i++) {
      circles.push({
        density: sampler(),
        offset: [sampler() * maxX, sampler() * maxY],
        radius: sampler() * 0.3,
      });
    }

    return circles;
  }
}
