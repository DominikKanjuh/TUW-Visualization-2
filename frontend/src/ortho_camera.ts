import { mat4, vec3 } from "webgpu-matrix";

export class OrthoCamera {
  private projectionMatrix: Float32Array;
  private viewMatrix: Float32Array;

  private eye: vec3.default;
  private target: vec3.default;
  private up: vec3.default;

  private aspect: number;
  private left: number;
  private right: number;
  private bottom: number;
  private top: number;

  constructor(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
    eye = [0, 0, -3],
    target = [0, 0, 1],
    up = [0, 1, 0]
  ) {
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.identity();

    this.aspect = (right - left) / (top - bottom);

    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;

    this.eye = eye;
    this.target = target;
    this.up = up;

    this.refreshViewMatrix();

    mat4.ortho(left, right, bottom, top, near, far, this.projectionMatrix);
  }

  public refreshViewMatrix(): void {
    mat4.lookAt(this.eye, this.target, this.up, this.viewMatrix);
  }

  public refreshProjectionMatrix(): void {
    mat4.ortho(
      this.left,
      this.right,
      this.bottom,
      this.top,
      1,
      10000,
      this.projectionMatrix
    );
  }

  private getZoomLevel(): number {
    return (this.right - this.left) / 2;
  }

  // move camera
  public translateCamera(x: number, y: number, z: number): void {
    const speed = this.getZoomLevel() * 0.05;

    this.left -= x * speed;
    this.right -= x * speed;
    this.bottom -= y * speed;
    this.top -= y * speed;

    if (z !== 0) {
      this.zoomCamera(z);
    }

    this.refreshProjectionMatrix();
    this.refreshViewMatrix();
  }
  public mapToLatLng() {
    // Define the bounds for latitude and longitude
    const minLat = -90;
    const maxLat = 90;
    const minLng = -180;
    const maxLng = 180;

    // Calculate scaling factors
    const latScale = (this.top - this.bottom) / (maxLat - minLat);
    const lngScale = (this.right - this.left) / (maxLng - minLng);

    // Map orthographic bounds to latitude/longitude
    const latMin = this.bottom * latScale + minLat;
    const latMax = this.top * latScale + minLat;
    const lngMin = this.left * lngScale + minLng;
    const lngMax = this.right * lngScale + minLng;

    return {
      latMin: this.clamp(latMin, minLat, maxLat),
      latMax: this.clamp(latMax, minLat, maxLat),
      lngMin: this.clamp(lngMin, minLng, maxLng),
      lngMax: this.clamp(lngMax, minLng, maxLng),
    };
  }

  // make the orthographic area bigger or smaller
  public zoomCamera(zoom: number): void {
    const speed = this.getZoomLevel() * 0.05;

    this.left += zoom * this.aspect * speed;
    this.right -= zoom * this.aspect * speed;
    this.bottom += zoom * speed;
    this.top -= zoom * speed;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  // get view-projection matrix
  public getViewProjectionMatrix(): Float32Array {
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(this.projectionMatrix, this.viewMatrix, viewProjectionMatrix);
    return viewProjectionMatrix;
  }

  public getTarget(): vec3.default {
    return this.target;
  }

  public getEye(): vec3.default {
    return this.eye;
  }

  private radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  private degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
