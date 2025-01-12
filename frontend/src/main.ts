import { Stipple } from "./Stippling/Stipple";
import shader from "./shaders/shader.wgsl";
import { mat4, vec3 } from "webgpu-matrix";
import L from "leaflet";
import { OrthoCamera } from "./ortho_camera";
import { CircleHelper } from "./Stippling/Circle";
import { BufferHandler } from "./Stippling/BufferHandler";
import { DensityFunctionLinear } from "./Stippling/DensityFunctionLinear";

import { fetchStiples } from "./api/repository";
import { DensityFunction2D } from "./Stippling/DensityFunction2D";
import { DensityFunction2DRastrigrinFunction } from "./Stippling/DensityFunction2DRastrigrinFunction";
import initializeDrawer from "./components/drawer/Drawer";
import "leaflet/dist/leaflet.css";

import "./styles.css";

let map: L.Map | null = null;

function initializeMap(): void {
  const mapContainer = document.getElementById("map");

  if (!mapContainer) {
    console.error("Map container (#map) not found.");
    return;
  }

  map = L.map("map").setView([51.505, -0.09], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// Initialize all the components
document.addEventListener("DOMContentLoaded", () => {
  //   initializeSizes();
  initializeDrawer();
  initializeMap();
});

const canvas = document.getElementById("gfx-main") as HTMLCanvasElement;
const debug_div = document.getElementById("debug") as HTMLElement;

let aspect = canvas.width / canvas.height;
console.log("aspect", canvas.width, canvas.height, aspect);

const adapter = (await navigator.gpu.requestAdapter()) as GPUAdapter;
if (!adapter) {
  debug_div.innerText = "WebGPU is supported but no adapter found!";
  throw Error("Couldn't request WebGPU adapter.");
}

const device = (await adapter.requestDevice()) as GPUDevice;
const context = canvas.getContext("webgpu") as GPUCanvasContext;
const format = "bgra8unorm" as GPUTextureFormat;
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format,
});

const shaderModule = device.createShaderModule({
  label: "circle shader module",
  code: shader,
});

const pipeline = device.createRenderPipeline({
  label: "render pipeline",
  layout: "auto",
  vertex: {
    module: shaderModule,
    buffers: [
      {
        // position
        arrayStride: 2 * 4,
        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
      },
      {
        arrayStride: 4 * 4,
        stepMode: "instance",
        attributes: [
          { shaderLocation: 1, offset: 0, format: "float32" }, // density
          { shaderLocation: 2, offset: 4, format: "float32x2" }, // offset
          { shaderLocation: 3, offset: 12, format: "float32" }, // radius
        ],
      },
    ],
  },
  fragment: {
    module: shaderModule,
    targets: [{ format: presentationFormat }],
  },
  depthStencil: {
    format: "depth24plus-stencil8",
    depthCompare: "less",
    depthWriteEnabled: true,
  },
});

// ! Used for initial buffer size
const staticUnitSize =
  1 * 4 + // density is 1 32bit float
  2 * 4 + // offset is 2 32bit floats
  1 * 4; // radius is 1 32bit floats

const storageBufferLimit = device.limits.maxStorageBufferBindingSize;
const maxNumberOfObjects = Math.floor(storageBufferLimit / staticUnitSize);
const kNumObjects = 1e4;
console.log("maxNumberOfObjects", maxNumberOfObjects);
console.log("kNumObjects", kNumObjects);

const staticVertexBufferSize = staticUnitSize * maxNumberOfObjects;
console.log("staticVertexBufferSize", staticVertexBufferSize);

const staticVertexBuffer = device.createBuffer({
  label: "static vertex buffer for instancing",
  size: staticVertexBufferSize,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const bufferHandler = new BufferHandler(
  device,
  staticVertexBuffer,
  staticVertexBufferSize
);
bufferHandler.register_change(() => {
  requestAnimationFrame(generateFrame);
});

const uniformBufferSize =
    4 * 4 +     // screen size vec2 upsized to vec4 by padding
    16 * 4 +    // mvp mat4
    4 * 4 +     // change with density f32, point size f32 upsize to vec4 by padding
    4 * 4 +     // vec4f color 1
    4 * 4 +     // vec4f color 2
    4 * 4;      // vec2f stops for blending padded to vec4

console.log("uniformBufferSize", uniformBufferSize);
const uniformBuffer = device.createBuffer({
  label: "uniform buffer",
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const bindGroup = device.createBindGroup({
  label: "triangle bind group",
  layout: pipeline.getBindGroupLayout(0),
  entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
});

const { vertexData, numVertices } = createCircleVertices(32);
const vertexBuffer = device.createBuffer({
  label: "vertex buffer vertices",
  size: vertexData.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertexData);

function updateVertexBuffer(newData: Float32Array) {
  device.queue.writeBuffer(staticVertexBuffer, 0, newData);
}

const depthTexture = device.createTexture({
  label: "depth-stencil texture",
  size: { width: canvas.width, height: canvas.height },
  format: "depth24plus-stencil8",
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
});
const renderPassDescriptor = {
  label: "basic render pass",
  colorAttachments: [
    {
      clearValue: [0.3, 0.3, 0.3, 1],
      loadOp: "clear",
      storeOp: "store",
    },
  ],
  depthStencilAttachment: {
    view: depthTexture.createView(),
    depthClearValue: 1.0,
    depthLoadOp: "clear",
    depthStoreOp: "store",
    format: "depth24plus-stencil8",
    stencilLoadOp: "clear",
    stencilStoreOp: "discard",
  },
} as GPURenderPassDescriptor;

// const camera = new Camera(Math.PI / 3, aspect, 1, 10000);
const camera = new OrthoCamera(-aspect, aspect, -1, 1, 1, 10000);
camera.translateCamera(0, 0, 700);

let mouseDown = false;
canvas.onmousedown = (e) => {
  mouseDown = true;
};
canvas.onmouseup = (e) => {
  mouseDown = false;
};

canvas.onmousemove = (e) => {
  const movement_speed = 0.01;
  if (mouseDown) {
    // camera should move faster the further away it is from the target
    const distance = vec3.distance(camera.getEye(), camera.getTarget());
    const speed = Math.max(0.01, Math.min(100, distance)) * movement_speed;
    // console.log(distance, speed);
    camera.translateCamera(e.movementX * speed, -e.movementY * speed, 0);
    // camera.translateCamera(-e.movementX * movement_speed, -e.movementY * movement_speed, 0);
  }
  requestAnimationFrame(generateFrame);
};

canvas.onwheel = (e) => {
  const scroll_speed = 0.001;
  // the camera should move between 0.5 and 100 units. The camera should move faster the further away it is from the target.
  const distance = vec3.distance(camera.getEye(), camera.getTarget());
  const speed = Math.max(0.5, Math.min(100, distance)) * scroll_speed;
  camera.translateCamera(0, 0, -e.deltaY * speed);
  requestAnimationFrame(generateFrame);
};

function updateUniform() {
  // create a typed-array to hold the values for the uniforms in JavaScript
  const uniformValues = new Float32Array(uniformBufferSize / 4);

  // set the screen size
  uniformValues.set([canvas.width, canvas.height], 0); // size 4

  // set the mvp matrix
  uniformValues.set(camera.getViewProjectionMatrix(), 4); // size 16

  // Point Size?
  uniformValues.set([
      vary_size_with_density_checkbox.checked ? 1.0: 0.0,     // Change with density
      parseFloat(stipple_size_multiplier_range.value)         // Overall point size multiplier
  ], 20); // size 4

  // uniformValues.set([parseFloat(stipple_size_multiplier_range.value)], 21); // size 4


  // * Color
  // First color (colorPicker1)
  uniformValues.set(hexcodeToVec4(colorPicker1.value), 24); // size 4
  // Second color (colorPicker2)
  uniformValues.set(hexcodeToVec4(colorPicker2.value), 28); // size 4
  // color stops
  uniformValues.set([parseFloat(colorPicker1Range.value), parseFloat(colorPicker2Range.value)], 32); // size 4

  device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
}

function hexcodeToVec4(hexcode: string): Float32Array {
    const hex = parseInt(hexcode.slice(1), 16);
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;

    return new Float32Array([r / 255, g / 255, b / 255, 1.0]);
}

function generateFrame() {
  //   stats.begin();

  updateUniform();

  // Get the current texture from the canvas context and
  // set it as the texture to render to.
  (
    renderPassDescriptor.colorAttachments as GPURenderPassColorAttachment[]
  )[0].view = context.getCurrentTexture().createView();

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setVertexBuffer(1, staticVertexBuffer);
  // pass.setVertexBuffer(2, changingVertexBuffer);

  pass.draw(numVertices, kNumObjects);

  pass.end();

  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  //   stats.end();
  // requestAnimationFrame(generateFrame);
}

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const canvas = entry.target as HTMLCanvasElement;
    const width = entry.contentBoxSize[0].inlineSize;
    const height = entry.contentBoxSize[0].blockSize;
    canvas.width = Math.max(
      1,
      Math.min(width, device.limits.maxTextureDimension2D)
    );
    canvas.height = Math.max(
      1,
      Math.min(height, device.limits.maxTextureDimension2D)
    );
    aspect = canvas.width / canvas.height;
    // re-render
    generateFrame();
  }
});
observer.observe(canvas);

requestAnimationFrame(generateFrame);

/**
 * Create a circle with a given number of segments and radius without an index buffer.
 * The first vertex is the center of the circle. The next vertex is the top point on the circle.
 * @param numSegments The number of segments to use for the circle.
 */
function createCircleVertices(numSegments = 32) {
  const radius = 1;
  const startAngle = 0;
  const endAngle = Math.PI * 2;

  const numVertices = numSegments * 3;
  const vertexData = new Float32Array(numSegments * 2 * 3);

  let offset = 0;

  function addVertex(x: number, y: number, z: number = 0) {
    vertexData[offset++] = x;
    vertexData[offset++] = y;
    // vertexData[offset++] = z;
  }

  for (let i = 0; i < numSegments; ++i) {
    const angle1 =
      startAngle + ((i + 0) * (endAngle - startAngle)) / numSegments;
    const angle2 =
      startAngle + ((i + 1) * (endAngle - startAngle)) / numSegments;

    const c1 = Math.cos(angle1);
    const s1 = Math.sin(angle1);
    const c2 = Math.cos(angle2);
    const s2 = Math.sin(angle2);

    addVertex(c1 * radius, s1 * radius);
    addVertex(c2 * radius, s2 * radius);
    addVertex(0, 0);
  }

  return {
    vertexData,
    numVertices,
  };
}


const dataset_dropdown = document.getElementById(
  "dataset_dropdown"
) as HTMLSelectElement;

const calc_btn = document.getElementById(
  "btn-compute-stiples"
) as HTMLButtonElement;

const fidelity_scale = document.getElementById(
  "fidelity_scale"
) as HTMLInputElement;
const fidelity_x = document.getElementById("fidelity_x") as HTMLInputElement;
const fidelity_y = document.getElementById("fidelity_y") as HTMLInputElement;

fidelity_scale.onchange = onFidelityScaleChange;
onFidelityScaleChange();

function onFidelityScaleChange() {
    fidelity_x.value = String(parseInt(fidelity_scale.value) * 3);
    fidelity_y.value = String(parseInt(fidelity_scale.value) * 4);
}

const initial_stipple_size = document.getElementById("initial_stipple_size") as HTMLInputElement;
const selected_stipple_size_p = document.getElementById("selected_stipple_size") as HTMLParagraphElement;

initial_stipple_size.oninput = onStippleSizeChange;
onStippleSizeChange()

function onStippleSizeChange() {
    selected_stipple_size_p.innerText = initial_stipple_size.value;
}

const max_iterations = document.getElementById("max_iterations") as HTMLInputElement;
const show_iterations_input = document.getElementById("show_iterations") as HTMLInputElement;

// Multiplier for stipple size
const stipple_size_multiplier_range = document.getElementById("stipple_size_multiplier") as HTMLInputElement;
stipple_size_multiplier_range.oninput = () => requestAnimationFrame(generateFrame);

// True: Vary point size with density
const vary_size_with_density_checkbox = document.getElementById("vary_size_with_density") as HTMLInputElement;
vary_size_with_density_checkbox.onchange = () => requestAnimationFrame(generateFrame);

const fetchStipples = async (
  type: "air_pollution" | "temperature"
): Promise<DensityFunction2D> => {
  if (!map) {
    throw Error("Map not initialized");
  }

  const bounds = map.getBounds();

  const stipplesResponse = await fetchStiples(type, {
    minLat: String(bounds.getSouth()),
    maxLat: String(bounds.getNorth()),
    minLng: String(bounds.getWest()),
    maxLng: String(bounds.getEast()),
    w: fidelity_x.value,
    h: fidelity_y.value,
  });

  const stipplesData = stipplesResponse.stiples.map((row) =>
    row.map((obj) => obj?.val || 0)
  );

  const densityFunction = new DensityFunction2D(stipplesData);

  return densityFunction;
};

calc_btn.onclick = async (e) => {
  e.preventDefault();

  let densityFunction: DensityFunction2D;
  const x = parseInt(fidelity_x.value);
  const y = parseInt(fidelity_y.value);
  console.log(`x: ${x}, y: ${y}`);

  const max_iter = parseInt(max_iterations.value);
  console.log(`max_iter: ${max_iter}`);
  const stipple_size = parseFloat(initial_stipple_size.value);
  console.log(`stipple_size: ${stipple_size}`);

  switch (dataset_dropdown.value) {
    case "linear":
      densityFunction = new DensityFunctionLinear(x, y);
      break;
    case "rastrigrin":
      densityFunction = new DensityFunction2DRastrigrinFunction(x, y);
      break;
    case "rosenbrock":
      densityFunction = new DensityFunction2DRastrigrinFunction(x, y);
      break;
    case "air_pollution":
      densityFunction = await fetchStipples("air_pollution");
      break;
    default:
      densityFunction = new DensityFunctionLinear(x, y);
      break;
  }

    const {stipples, voronoi} = await Stipple.stippleDensityFunctionWithWorker(
        densityFunction,
        stipple_size,
        0.0,
        0.01,
        max_iter,
        show_iterations_input.checked ? bufferHandler : null,
    );
    console.log("stipples", stipples);
    console.log("voronoi", voronoi);

    bufferHandler.replaceData(
        CircleHelper.circlesToBuffers(Stipple.stipplesToCircles(stipples))
    );
}

//Acesss the color with colorPickerX.value
const colorPicker1 = document.getElementById("CP1") as HTMLInputElement
colorPicker1.oninput = () => requestAnimationFrame(generateFrame);
const colorPicker2 = document.getElementById("CP2") as HTMLInputElement
colorPicker2.oninput = () => requestAnimationFrame(generateFrame);

//Acess the color range with colorPickerXRange.value
const colorPicker1Range = document.getElementById("CP1_range") as HTMLInputElement
colorPicker1Range.onchange = () => requestAnimationFrame(generateFrame);
const colorPicker2Range = document.getElementById("CP2_range") as HTMLInputElement
colorPicker2Range.onchange = () => requestAnimationFrame(generateFrame);



