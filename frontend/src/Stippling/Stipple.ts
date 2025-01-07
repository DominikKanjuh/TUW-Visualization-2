import d3 from "d3";

export class Stipple {
    x: number;
    y: number;
    density: number;
    radius: number;

    constructor(x: number, y: number, density: number = 0.5, radius: number = 0.5) {
        this.x = x;
        this.y = y;
        this.density = density;
        this.radius = radius;
    }

    static createRandomStipples(numStipples: number, maxX: number, maxY: number, sampler = d3.randomUniform): Stipple[] {
        const stipples: Stipple[] = [];
        const xSampler = sampler(0, maxX);
        const ySampler = sampler(0, maxY);

        for (let i = 0; i < numStipples; i++) {
            stipples.push(new Stipple(
                xSampler(),
                ySampler()
            ));
        }
        return stipples;
    }
}

export class Stippling {
    stipples: Stipple[];

    constructor(stipples: Stipple[]) {
        this.stipples = stipples;
    }
}