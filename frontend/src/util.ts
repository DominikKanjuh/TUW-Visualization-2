/**
 * @fileoverview Utility functions for WebGPU and data processing
 * @module frontend/util
 */

import { Stipple } from "./Stippling/Stipple";

/**
 * Utility class containing static helper methods
 */
export class Util {
  /**
   * Creates a WebGPU pipeline descriptor for pos4_uv2 vertex format
   * @param {GPUDevice} device - The WebGPU device
   * @param {GPUShaderModule} shader_module - The shader module
   * @param {string} vs_entry_point - Vertex shader entry point
   * @param {string} fs_entry_point - Fragment shader entry point
   * @param {GPUTextureFormat} format - The texture format
   * @returns {GPURenderPipelineDescriptor} The pipeline descriptor
   */
  static createPipelineDescriptor_pos4_uv2(
    device: GPUDevice,
    shader_module: GPUShaderModule,
    vs_entry_point: string,
    fs_entry_point: string,
    format: GPUTextureFormat
  ): GPURenderPipelineDescriptor {
    return {
      layout: "auto",
      vertex: {
        module: shader_module,
        entryPoint: vs_entry_point,
        buffers: [
          {
            arrayStride: 6 * 4,
            attributes: [
              {
                // position
                format: "float32x4",
                offset: 0,
                shaderLocation: 0,
              },
              {
                // uv
                format: "float32x2",
                shaderLocation: 1,
                offset: 4 * 4,
              },
            ],
          },
        ],
      },
      fragment: {
        module: shader_module,
        entryPoint: fs_entry_point,
        targets: [{ format: format }],
      },
    } as GPURenderPipelineDescriptor;
  }

  /**
   * Finds minimum and maximum values in an array
   * @param {number[]} numbers - Array of numbers
   * @returns {number[]} Array containing [min, max]
   */
  static minMaxOfArray(numbers: number[]): number[] {
    let min = Infinity;
    let max = -Infinity;
    for (const n of numbers) {
      min = Math.min(min, n);
      max = Math.max(max, n);
    }
    return [min, max];
  }

  /**
   * Clamps a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Finds minimum and maximum values in a 2D array
   * @param {number[][]} array - 2D array of numbers
   * @returns {{ min: number, max: number }} Object containing min and max values
   */
  static minMaxOfArray2D(array: number[][]): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array[i].length; j++) {
        min = Math.min(min, array[i][j]);
        max = Math.max(max, array[i][j]);
      }
    }
    return { min, max };
  }
}
