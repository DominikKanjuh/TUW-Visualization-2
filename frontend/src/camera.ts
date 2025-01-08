import {mat4, vec3} from 'webgpu-matrix';

class Camera {
    private perspectiveMatrix: Float32Array;
    private viewMatrix: Float32Array;

    private eye: vec3.default;
    private target: vec3.default;
    private up: vec3.default;

    constructor(fovY: number, aspect: number, near: number, far: number,
                eye = [0, 0, -3], target = [0, 0, 1], up = [0, 1, 0]) {
        this.perspectiveMatrix = mat4.create();
        this.viewMatrix = mat4.identity();

        this.eye = eye;
        this.target = target;
        this.up = up;

        this.refreshViewMatrix();

        // this.up = vec3.fromValues(0, 1, 0);
        mat4.perspective(fovY, aspect, near, far, this.perspectiveMatrix);
    }

    public refreshViewMatrix(): void {
        mat4.lookAt(this.eye, this.target, this.up, this.viewMatrix);
    }

    // move camera
    public translateCamera(x: number, y: number, z: number): void {
        // mat4.translate(this.viewMatrix, vec3.fromValues(x, y, z), this.viewMatrix);
        this.eye[0] += x;
        this.eye[1] += y;
        this.eye[2] += z;
        this.refreshViewMatrix();
    }

    // get view-projection matrix
    public getViewProjectionMatrix(): Float32Array {
        const viewProjectionMatrix = mat4.create();
        mat4.multiply(this.perspectiveMatrix, this.viewMatrix, viewProjectionMatrix);
        return viewProjectionMatrix;
    }

    public getTarget(): vec3.default {
        return this.target;
    }

    public getEye(): vec3.default {
        return this.eye;
    }

    private radToDeg(rad: number): number {
        return rad * 180 / Math.PI;
    }

    private degToRad(deg: number): number {
        return deg * Math.PI / 180;
    }
}

export default Camera;