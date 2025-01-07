import {
    cubeVertexArray,
    cubeVertexSize,
    cubeVertexCount,
    cubeUVOffset,
    cubePositionOffset,
    cubeColorOffset,
} from "./cube";

import {mat4, vec3} from "webgpu-matrix";

import render_cube_shader from "./shaders/render_cube.wgsl";
import render_depth_shader from "./shaders/render_depth.wgsl";
import render_depth_on_quad_shader from "./shaders/render_depth_on_quad.wgsl";
import Camera from "./camera";
import {Util} from "./util";
import {generateBuffers} from "./generateBuffers";
import { Stipple } from "./Stippling/Stipple";

const canvas = document.getElementById("gfx-main") as HTMLCanvasElement;
const debug_div = document.getElementById("debug") as HTMLElement;

const adapter = (await navigator.gpu.requestAdapter()) as GPUAdapter;
if (!adapter) {
    debug_div.innerText = "WebGPU is supported but no adapter found!";
    throw Error("Couldn't request WebGPU adapter.");
}

const device = (await adapter.requestDevice()) as GPUDevice;
const context = canvas.getContext("webgpu") as GPUCanvasContext;
const format = "bgra8unorm" as GPUTextureFormat;

context.configure({
    device,
    format,
});

// const quad_vertex_array = new Float32Array([
//     -1, -1, 0, 1, 0, 0, // bl
//     1, -1, 0, 1, 1, 0, // br
//     -1, 1, 0, 1, 0, 1, // tl
//     1, 1, 0, 1, 1, 1, // tr
// ]);

// Region Vertex Buffer
let stipples: Stipple[] = [];
const { vertexBuffer, indexBuffer, vertexCount } = generateBuffers(device, stipples);

const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
renderPass.setPipeline(pipeline);
renderPass.setVertexBuffer(0, vertexBuffer);
renderPass.setIndexBuffer(indexBuffer, 'uint16');
renderPass.drawIndexed(vertexCount, 1, 0, 0, 0);
renderPass.end();

// const quad_vertexBuffer = device.createBuffer({
//     label: "quad vertex buffer",
//     size: quad_vertex_array.byteLength,
//     usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
//     mappedAtCreation: true,
// });
// new Float32Array(quad_vertexBuffer.getMappedRange()).set(quad_vertex_array);
// quad_vertexBuffer.unmap();

// Region Pipeline
// import compute_shader from "./shaders/compute.wgsl";
//
// const computeShaderModule = device.createShaderModule({
//     label: "compute shader",
//     code: compute_shader
// })
// const computePipeline = device.createComputePipeline({
//     label: "compute pipeline",
//     layout: 'auto',
//     compute: {
//         module: computeShaderModule,
//         entryPoint: "main"
//     }
// });
//
//
// import display_shader from "./shaders/display_on_screan.wgsl";
//
// const displayShaderModule = device.createShaderModule({
//     label: "display shader",
//     code: display_shader,
// });
// const displayPipeline = device.createRenderPipeline({
//     label: "display pipeline",
//     layout: 'auto',
//     vertex: {
//         module: displayShaderModule,
//         entryPoint: "vs_main",
//         buffers: [{
//             arrayStride: 6 * 4,
//             attributes: [
//                 { // position
//                     format: 'float32x4',
//                     offset: 0,
//                     shaderLocation: 0
//                 },
//                 { // uv
//                     format: 'float32x2',
//                     offset: 4 * 4,
//                     shaderLocation: 1
//                 }
//             ]
//         }]
//     },
//     fragment: {
//         module: displayShaderModule,
//         entryPoint: "fs_main",
//         targets: [{format: format}],
//     },
//     primitive: {topology: 'triangle-strip'},
// })


// Region Framebuffer
// const framebuffer = device.createBuffer({
//     label: "framebuffer",
//     size: canvas.width * canvas.height * 4 * Float32Array.BYTES_PER_ELEMENT,
//     usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
//     mappedAtCreation: true,
// });

// Region Uniform
// stores the screen size
const screen_size_uniformBuffer = device.createBuffer({
    label: "screen size uniform",
    size: 2 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
})
new Float32Array(screen_size_uniformBuffer.getMappedRange()).set([canvas.width, canvas.height]);
screen_size_uniformBuffer.unmap();

// const compute_shader_bindGroupLayout = computePipeline.getBindGroupLayout(0);
// compute_shader_bindGroupLayout.label = "compute pipeline layout";
// const compute_shader_bindGroup = device.createBindGroup({
//     label: "compute bind group",
//     layout: compute_shader_bindGroupLayout,
//     entries: [
//         {
//             binding: 0,
//             resource: {
//                 buffer: screen_size_uniformBuffer,
//             }
//         },
//         {
//             binding: 1,
//             resource: {
//                 buffer: framebuffer,
//             }
//         }
//     ]
// });
//
// const display_pipelineLayout = displayPipeline.getBindGroupLayout(0);
// display_pipelineLayout.label = "display pipeline layout";
// const display_shader_bindGroup = device.createBindGroup({
//     label: "display bind group",
//     layout: display_pipelineLayout,
//     entries: [
//         {
//             binding: 0,
//             resource: {
//                 buffer: screen_size_uniformBuffer,
//             }
//         },
//         {
//             binding: 1,
//             resource: {
//                 buffer: framebuffer,
//             }
//         }
//     ]
// })

// Region Render Pass Descriptor
// const display_renderPassDescriptor: GPURenderPassDescriptor = {
//     label: "display render pass",
//     colorAttachments: [
//         {
//             storeOp: 'store',
//             loadOp: 'load',
//             view: context.getCurrentTexture().createView(),
//             clearValue: [0, 0, 0, 1],
//         }
//     ]
// };
//
// debug_div.innerText = `${canvas.width}x${canvas.height}: ${new Float32Array([canvas.width, canvas.height])}`;

// Region Render
function generateFrame() {
    const commandEncoder = device.createCommandEncoder();

    // Compute
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, compute_shader_bindGroup);
    computePass.dispatchWorkgroups(canvas.width, canvas.height, 1);
    computePass.end();

    // reset view to current texture
    (display_renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[])[0]
        .view = context.getCurrentTexture().createView();

    // Display
    const displayPass = commandEncoder.beginRenderPass(display_renderPassDescriptor);
    displayPass.setPipeline(displayPipeline);   // set the pipeline
    displayPass.setBindGroup(0, display_shader_bindGroup);
    displayPass.setVertexBuffer(0, quad_vertexBuffer);
    displayPass.draw(4, 1, 0, 0);
    displayPass.end();

    // unmapping the framebuffer
    framebuffer.unmap();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(generateFrame);
}

requestAnimationFrame(generateFrame)