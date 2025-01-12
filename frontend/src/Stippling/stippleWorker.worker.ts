import {DensityFunction2D} from "./DensityFunction2D";
import * as d3 from "d3";
import {FromWorkerMessage, ToWorkerMessage} from "./WorkerTypes";
import {Voronoi} from "d3";

const ctx: Worker = self as any;

ctx.onmessage = async function (event) {
    const {
        densityFunction,
        initialStippleRadius,
        initialErrorThreshold,
        thresholdConvergenceRate,
        maxIterations,
    } = event.data as ToWorkerMessage;

    console.log("Worker received data", event.data);

    const workerDensityFunction = new DensityFunction2D(densityFunction.data);

    // Call the function with received data
    await stippleDensityFunction(
        workerDensityFunction,
        initialStippleRadius,
        initialErrorThreshold,
        thresholdConvergenceRate,
        maxIterations
    );
};

async function stippleDensityFunction(
    densityFunction: DensityFunction2D,
    initialStippleRadius: number,
    initialErrorThreshold: number,
    thresholdConvergenceRate: number,
    maxIterations: number
): Promise<void> {
    // * Initialize the stipples
    // Find good number of stipples
    const stippleArea = Math.pow(initialStippleRadius, 2) * Math.PI;
    const numOfInitialStipples = Math.round(
        ((densityFunction.width * densityFunction.height) / stippleArea) * 0.7);

    let stipples = createRandomStipples(numOfInitialStipples, densityFunction.width, densityFunction.height);

    // * Loop until convergence
    let lastVoronoi = null;
    let errorThreshold = initialErrorThreshold;
    let splitOrMerge_happened = false;

    let iteration = 0;

    do {
        splitOrMerge_happened = false;
        // Create a voronoi diagram using the stipples and delaunay triangulation
        const voronoi = d3.Delaunay
            .from(stipples.map(s => [s.x, s.y]))
            .voronoi([0, 0, densityFunction.width, densityFunction.height]);

        stipples = densityFunction.assignDensity(stipples, voronoi) as WorkerStipple[];

        // console.log("Density sum of all stipples", stipples.reduce((acc, s) => acc + s.density, 0));

        // * Create new stipples by splitting or merging
        const change = handleStippleChange(stipples, voronoi, stippleArea, errorThreshold);
        splitOrMerge_happened = change.change;
        stipples = change.new_stipples;
        lastVoronoi = voronoi;

        // * progress update:
        ctx.postMessage({
            progress: (iteration / maxIterations) * 100,
            done: false,
            iteration,
            stipples: fillStippleProperties(stipples, densityFunction),
            // stipples: stipples,
            voronoi: lastVoronoi,
        } as FromWorkerMessage);

        errorThreshold += thresholdConvergenceRate;
        iteration++;
    } while (splitOrMerge_happened && iteration < maxIterations);

    // stipples = densityFunction.assignDensity(stipples, lastVoronoi) as WorkerStipple[];

    // * Return the final stipples
    // Send final result back to the main thread
    ctx.postMessage({
        progress: 100,
        done: true,
        iteration,
        stipples: fillStippleProperties(stipples, densityFunction),
        // stipples: stipples,
        voronoi: lastVoronoi,
    } as FromWorkerMessage);
}


function    handleStippleChange(stipples: WorkerStipple[], voronoi: Voronoi<number>, area: number, error: number): {
    change: boolean,
    new_stipples: WorkerStipple[]
} {
    let new_stipples: WorkerStipple[] = [];
    let change = false;

    const deleteThreshold = area - error;
    const splitThreshold = area + error;

    for (let i = 0; i < stipples.length; ++i) {
        const s = stipples[i];
        const cell = d3.polygonHull(voronoi.cellPolygon(i))!;
        if (s.density < deleteThreshold) {
            change = true;
        } else if (s.density > splitThreshold) {
            change = true;
            const {cell1, cell2} = splitCell(cell);

            // Update position for the first cell
            s.setPosition(cell1[0], cell1[1]);
            // s.setPosition(cell1[1], cell1[0]);
            // assert if out of bounds
            // if (cell1[0] < 0 || cell1[0] > 1 || cell1[1] < 0 || cell1[1] > 1) {
            //     console.log("Out of bounds", cell1);
            // }
            new_stipples.push(s);
            // And create a new stipple for the second cell
            // assert if out of bounds
            new_stipples.push(new WorkerStipple(cell2[0], cell2[1]));
            // new_stipples.push(new WorkerStipple(cell2[1], cell2[0]));
        } else {
            s.setPosition(...d3.polygonCentroid(cell));
            new_stipples.push(s);
        }
    }

    return {change, new_stipples};
}


/**
 * Fill the stipple properties with the correct values.
 * @param stipples
 * @param densityFunction
 */
function fillStippleProperties(stipples: WorkerStipple[], densityFunction: DensityFunction2D): WorkerStipple[] {
    const maxDensity = Math.max(...stipples.map(s => s.density));
    const minDensity = Math.min(...stipples.map(s => s.density));
    stipples.map(s => {
        s.density = (s.density - minDensity) / (maxDensity - minDensity);

        // set relative position for easier drawing
        s.relativeX = s.x / densityFunction.width;
        s.relativeY = s.y / densityFunction.height;
    });

    return stipples;
}

function createRandomStipples(numStipples: number, maxX: number, maxY: number, sampler = d3.randomUniform): WorkerStipple[] {
    const stipples: WorkerStipple[] = [];
    const xSampler = sampler(0, maxX);
    const ySampler = sampler(0, maxY);

    for (let i = 0; i < numStipples; i++) {
        stipples.push(new WorkerStipple(
            xSampler(),
            ySampler()
        ));
    }
    return stipples;
}

function splitCell(cell: Array<[number, number]>) {
    const centroid = d3.polygonCentroid(cell);
    let largestDir = [0, 0];
    let secondLargestDir = [0, 0];
    let largestDistance = 0;
    let secondLargestDistance = 0;

    for (const p of cell) {
        const direction = [
            p[0] - centroid[0],
            p[1] - centroid[1]
        ];
        const squaredDistance = direction.reduce((acc, c) => acc + Math.pow(c, 2), 0);
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
            centroid[1] + largestDir[1] * 0.5
        ],
        cell2: [
            centroid[0] + secondLargestDir[0] * 0.5,
            centroid[1] + secondLargestDir[1] * 0.5
        ]
    };
}

class WorkerStipple {
    x: number;
    y: number;

    relativeX: number;
    relativeY: number;

    density: number;
    radius: number;

    static maxIterations = 100;

    constructor(x: number, y: number, density: number = 0.5, radius: number = 0.5) {
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

    position(): number[] {
        return [this.x, this.y];
    }
}