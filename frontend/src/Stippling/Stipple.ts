import * as d3 from "d3";
import { DensityFunction2D } from "./DensityFunction2D";
import { Circle, CircleHelper } from "./Circle";
import { BufferHandler } from "./BufferHandler";
import { ProgressBar } from "../ProgressBar";
import { Voronoi } from "d3";
// import StippleWorker from 'worker-loader!./stippleWorker.worker.ts';
import { FromWorkerMessage } from "./WorkerTypes";

export class Stipple {
  x: number;
  y: number;

  relativeX: number;
  relativeY: number;

  density: number;
  radius: number;

  static stippleDebugDiv = document.getElementById(
    "stipple-debug"
  ) as HTMLDivElement;

  static progress_bar = document.getElementById(
    "progress-bar"
  ) as HTMLDivElement;
  static progressBar = new ProgressBar(Stipple.progress_bar);

  static maxIterations = 100;

  constructor(
    x: number,
    y: number,
    density: number = 0.5,
    radius: number = 0.5
  ) {
    this.x = x;
    this.y = y;
    this.relativeX = 0;
    this.relativeY = 0;
    this.density = density;
    this.radius = radius;
  }

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static createRandomStipples(
    numStipples: number,
    maxX: number,
    maxY: number,
    sampler = d3.randomUniform
  ): Stipple[] {
    const stipples: Stipple[] = [];
    const xSampler = sampler(0, maxX);
    const ySampler = sampler(0, maxY);

    for (let i = 0; i < numStipples; i++) {
      stipples.push(new Stipple(xSampler(), ySampler()));
    }
    return stipples;
  }

  static stipplesToCircles(stipples: Stipple[]): Circle[] {
    return stipples.map((s) => {
      return {
        density: s.density,
        offset: [s.x, s.y],
        radius: s.radius,
      } as Circle;
    });
  }

  static async stippleDensityFunctionWithWorker(
    densityFunction: DensityFunction2D,
    initialStippleRadius: number = 2.0,
    initialErrorThreshold: number = 0.0,
    thresholdConvergenceRate = 0.01,
    max_iter: number = 100,
    bufferHandler: BufferHandler | null = null
  ): Promise<{ stipples: Stipple[]; voronoi: Voronoi<number> }> {
    // const worker = new Worker(new URL('./stippleWorker.worker.ts', import.meta.url), {type: 'module'});
    // const worker = new StippleWorker();
    const worker = new Worker(
      new URL("./stippleWorker.worker", import.meta.url)
    );

    worker.postMessage({
      densityFunction: densityFunction,
      initialStippleRadius: initialStippleRadius,
      initialErrorThreshold: initialErrorThreshold,
      thresholdConvergenceRate: thresholdConvergenceRate,
      maxIterations: max_iter,
    });

    return new Promise((resolve, reject) => {
      worker.onmessage = (e: any) => {
        const data = e.data;
        // console.log("Worker message", data);
        const { progress, done, iteration, stipples, voronoi } =
          data as FromWorkerMessage;

        if (done) {
          console.log("Stippling done", data);
          Stipple.progressBar.setProgress(100);
          worker.terminate();
          resolve({ stipples, voronoi });
        } else {
          // console.log("Stippling progress", progress);
          Stipple.progressBar.setProgress(progress);
          this.stippleDebugDiv.innerText = `Iteration: ${iteration}, Stipples: ${stipples.length}`;
          if (bufferHandler) {
            bufferHandler.exchange_data(
              CircleHelper.circlesToBuffers(Stipple.stipplesToCircles(stipples))
            );
          }
        }
      };
    });
  }

  static async stippleDensityFunction(
    densityFunction: DensityFunction2D,
    initialStippleRadius: number = 2.0,
    initialErrorThreshold: number = 0.0,
    thresholdConvergenceRate = 0.01,
    bufferHandler: BufferHandler | null = null
  ) {
    // * Initialize the stipples
    // Find good number of stipples
    const stippleArea = Math.pow(initialStippleRadius, 2) * Math.PI;
    const numOfInitialStipples = Math.round(
      ((densityFunction.width * densityFunction.height) / stippleArea) * 0.7
    );
    console.log("numOfInitialStipples", numOfInitialStipples);

    let stipples = Stipple.createRandomStipples(
      numOfInitialStipples,
      densityFunction.width,
      densityFunction.height
    );

    // * Loop until convergence
    let lastVoronoi = null;
    let errorThreshold = initialErrorThreshold;
    let splitOrMerge_happened = false;

    let iteration = 0;
    do {
      splitOrMerge_happened = false;
      // Create a voronoi diagram using the stipples and delaunay triangulation
      const voronoi = d3.Delaunay.from(stipples.map((s) => [s.x, s.y])).voronoi(
        [0, 0, densityFunction.width, densityFunction.height]
      );

      stipples = densityFunction.assignDensity(stipples, voronoi);

      // * Create new stipples by splitting or merging
      const nextStipples = [];

      const deleteThreshold = stippleArea - errorThreshold;
      const splitThreshold = stippleArea + errorThreshold;

      // loop over all stipples and check if they need to be split or merged
      for (let i = 0; i < stipples.length; ++i) {
        const s = stipples[i];
        // let cell = d3.polygonHull(voronoi.cellPolygon(i));
        // if (!cell) {
        //     console.error("No cell found for stipple", s);
        //     cell = [[s.x, s.y]];
        // }
        const cellPolygon = voronoi.cellPolygon(i);
        if (!cellPolygon) {
          console.error("No cell found for stipple", s);
        }
        let cell: Array<[number, number]> = [[s.x, s.y]];
        if (cellPolygon) {
          cell = d3.polygonHull(cellPolygon)!;
        } else {
          console.error("No cell found for stipple", s);
        }

        if (s.density < deleteThreshold) {
          splitOrMerge_happened = true;
        } else if (s.density > splitThreshold) {
          splitOrMerge_happened = true;
          const { cell1, cell2 } = Stipple.splitCell(cell);

          // Update position for the first cell
          s.setPosition(cell1[0], cell1[1]);
          nextStipples.push(s);
          // And create a new stipple for the second cell
          nextStipples.push(new Stipple(cell2[0], cell2[1]));
        } else {
          s.setPosition(...d3.polygonCentroid(cell));
          nextStipples.push(s);
        }
      }
      if (!nextStipples.length) {
        nextStipples.push(
          Stipple.createRandomStipples(
            1,
            densityFunction.width,
            densityFunction.height
          )[0]
        );
      }
      stipples = nextStipples;

      // this.stippleDebugDiv.innerText = `Iteration: ${iteration}, Stipples: ${stipples.length}`;
      console.log(`Iteration: ${iteration}, Stipples: ${stipples.length}`);

      // Stipple.progressBar.setProgress(iteration / Stipple.maxIterations * 100);

      // // * Update the buffer handler if one was passed
      // if (bufferHandler) {
      //     bufferHandler.exchange_data(CircleHelper.circlesToBuffers(Stipple.stipplesToCircles(stipples)));
      // }

      lastVoronoi = voronoi;
      errorThreshold += thresholdConvergenceRate;
      iteration++;
    } while (splitOrMerge_happened && iteration < Stipple.maxIterations); // Keep looping until convergence or max iterations

    // * Return the final stipples
    // map output to the range [0, 1]
    const maxDensity = Math.max(...stipples.map((s) => s.density));
    const minDensity = Math.min(...stipples.map((s) => s.density));
    stipples.forEach((s) => {
      s.density = (s.density - minDensity) / (maxDensity - minDensity);

      // set relative position for easier drawing
      s.relativeX = s.x / densityFunction.width;
      s.relativeY = s.y / densityFunction.height;
    });

    return { stipples, voronoi: lastVoronoi };
  }

  static splitCell(cell: Array<[number, number]>) {
    const centroid = d3.polygonCentroid(cell);
    let largestDir = [0, 0];
    let secondLargestDir = [0, 0];
    let largestDistance = 0;
    let secondLargestDistance = 0;

    for (const p of cell) {
      const direction = [p[0] - centroid[0], p[1] - centroid[1]];
      const squaredDistance = direction.reduce(
        (acc, c) => acc + Math.pow(c, 2),
        0
      );
      if (squaredDistance > largestDistance) {
        secondLargestDistance = largestDistance;
        secondLargestDir = largestDir;
        largestDistance = squaredDistance;
        largestDir = direction;
      }
    }
    return {
      cell1: [
        centroid[0] + largestDir[0] * 0.5,
        centroid[1] + largestDir[1] * 0.5,
      ],
      cell2: [
        centroid[0] + secondLargestDir[0] * 0.5,
        centroid[1] + secondLargestDir[1] * 0.5,
      ],
    };
  }
}

export class Stippling {
  stipples: Stipple[];

  constructor(stipples: Stipple[]) {
    this.stipples = stipples;
  }
}
