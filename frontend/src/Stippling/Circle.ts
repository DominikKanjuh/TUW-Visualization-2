export type Circle = {
    // 1 32-bit float
    density: number;
    // 2 32-bit floats
    offset: number[];
    // 1 32-bit float
    radius: number;

}

export class CircleHelper {
    static circlesToBuffers(circles: Circle[]): Float32Array {
        // const densities = new Float32Array(circles.length);
        // const offsets = new Float32Array(circles.length * 2);
        // const radii = new Float32Array(circles.length);
        const circleBuffer = new Float32Array(circles.length * 4);

        circles.forEach((circle, i) => {
            circleBuffer.set([circle.density, circle.offset[0], circle.offset[1], circle.radius], i * 4);
            // densities.set([circle.density], i);
            // offsets.set(circle.offset, i * 2);
            // radii.set([circle.radius], i);
        });

        return circleBuffer

        // return [densities, offsets, radii];
    }

    static createRandomCircles(numCircle: number, maxX: number, maxY: number, sampler = Math.random): Circle[] {
        const circles: Circle[] = [];

        for (let i = 0; i < numCircle; i++) {
            circles.push({
                density: sampler(),
                offset: [sampler() * maxX, sampler() * maxY],
                radius: sampler() * 0.3
            });
        }

        return circles;
    }
}