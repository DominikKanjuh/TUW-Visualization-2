import {DensityFunction2D} from "./DensityFunction2D";
import {Stipple} from "./Stipple";

export type ToWorkerMessage = {
    densityFunction: DensityFunction2D;
    initialStippleRadius: number;
    initialErrorThreshold: number;
    thresholdConvergenceRate: number;
    maxIterations: number;
}

export type FromWorkerMessage = {
    progress: number;
    done: boolean;
    iteration: number;
    stipples: Stipple[];
    voronoi: d3.Voronoi<number>;
}