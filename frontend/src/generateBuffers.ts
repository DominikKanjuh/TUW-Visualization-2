/**
 * @fileoverview Utility function for generating WebGPU buffers from stipple data
 * @module frontend/generateBuffers
 */

import { Stipple } from './Stippling/Stipple';

/**
 * Generates vertex and index buffers for rendering stipples
 * @param {GPUDevice} device - The WebGPU device
 * @param {Stipple[]} stipples - Array of stipple points to render
 * @returns {{
 *   vertexBuffer: GPUBuffer,
 *   indexBuffer: GPUBuffer,
 *   vertexCount: number
 * }} Object containing the vertex buffer, index buffer, and vertex count
 */
export function generateBuffers(device: GPUDevice, stipples: Stipple[]) {
    const vertices = [];
    const indices = [];
    let vertexOffset = 0;

    for (const stipple of stipples) {
        const { x, y, density, radius } = stipple;

        // Define quad vertices around the stipple center
        const quadVertices = [
            // Top-left
            { position: [-radius, -radius], center: [x, y], density, radius },
            // Top-right
            { position: [radius, -radius], center: [x, y], density, radius },
            // Bottom-right
            { position: [radius, radius], center: [x, y], density, radius },
            // Bottom-left
            { position: [-radius, radius], center: [x, y], density, radius },
        ];

        // Push vertices to the array
        for (const v of quadVertices) {
            vertices.push(...v.position, ...v.center, v.density, v.radius);
        }

        // Define the two triangles that make up the quad
        indices.push(
            vertexOffset, vertexOffset + 1, vertexOffset + 2, // First triangle
            vertexOffset, vertexOffset + 2, vertexOffset + 3  // Second triangle
        );

        // Increment the vertex offset for the next stipple
        vertexOffset += 4;
    }

    // Flatten the vertex data
    const vertexData = new Float32Array(vertices);
    const indexData = new Uint16Array(indices);

    // Create vertex buffer
    const vertexBuffer = device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
    vertexBuffer.unmap();

    // Create index buffer
    const indexBuffer = device.createBuffer({
        size: indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Uint16Array(indexBuffer.getMappedRange()).set(indexData);
    indexBuffer.unmap();

    return { vertexBuffer, indexBuffer, vertexCount: indices.length };
}
