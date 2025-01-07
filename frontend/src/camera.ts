import {mat4, vec3} from 'webgpu-matrix';

class Camera {
    private perspectiveMatrix: Float32Array;
    private viewMatrix: Float32Array;

    // private up: vec3.default;

    constructor(fovY: number, aspect: number, near: number, far: number) {
        this.perspectiveMatrix = mat4.create();
        this.viewMatrix = mat4.identity();
        // this.up = vec3.fromValues(0, 1, 0);
        mat4.perspective(fovY, aspect, near, far, this.perspectiveMatrix);
    }

    // move camera
    public translateCamera(x: number, y: number, z: number): void {
        mat4.translate(this.viewMatrix, vec3.fromValues(x, y, z), this.viewMatrix);
    }

    // rotate camera
    public rotateCamera(x: number, y: number, z: number, angle_deg: number): void {
        mat4.rotate(this.viewMatrix, vec3.fromValues(x, y, z), this.degToRad(angle_deg), this.viewMatrix);
    }

    // get view-projection matrix
    public getViewProjectionMatrix(): Float32Array {
        const viewProjectionMatrix = mat4.create();
        mat4.multiply(this.perspectiveMatrix, this.viewMatrix, viewProjectionMatrix);
        return viewProjectionMatrix;
    }


    private radToDeg(rad: number): number {
        return rad * 180 / Math.PI;
    }

    private degToRad(deg: number): number {
        return deg * Math.PI / 180;
    }
}

export default Camera;