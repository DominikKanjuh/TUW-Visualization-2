/**
 * @fileoverview Perspective camera implementation for 3D visualization
 * @module frontend/camera
 */

import { mat4, vec3 } from "webgpu-matrix";

/**
 * Camera class for 3D scene viewing
 * Handles view and projection matrices for perspective projection
 * @class Camera
 */
class Camera {
  /** Perspective projection matrix */
  private perspectiveMatrix: Float32Array;
  /** View matrix for camera position and orientation */
  private viewMatrix: Float32Array;

  /** Camera position in world space */
  private eye: vec3.default;
  /** Point the camera is looking at */
  private target: vec3.default;
  /** Up vector for camera orientation */
  private up: vec3.default;

  /**
   * Creates a new perspective camera
   * @constructor
   * @param {number} fovY - Vertical field of view in radians
   * @param {number} aspect - Aspect ratio (width/height)
   * @param {number} near - Near clipping plane distance
   * @param {number} far - Far clipping plane distance
   * @param {vec3.default} [eye=[0,0,-3]] - Camera position
   * @param {vec3.default} [target=[0,0,1]] - Look-at target
   * @param {vec3.default} [up=[0,1,0]] - Up vector
   */
  constructor(
    fovY: number,
    aspect: number,
    near: number,
    far: number,
    eye = [0, 0, -3],
    target = [0, 0, 1],
    up = [0, 1, 0]
  ) {
    this.perspectiveMatrix = mat4.create();
    this.viewMatrix = mat4.identity();

    this.eye = eye;
    this.target = target;
    this.up = up;

    this.refreshViewMatrix();

    mat4.perspective(fovY, aspect, near, far, this.perspectiveMatrix);
  }

  /**
   * Updates the view matrix based on current camera position
   */
  public refreshViewMatrix(): void {
    mat4.lookAt(this.eye, this.target, this.up, this.viewMatrix);
  }

  /**
   * Translates the camera in world space
   * @param {number} x - X-axis translation
   * @param {number} y - Y-axis translation
   * @param {number} z - Z-axis translation
   */
  public translateCamera(x: number, y: number, z: number): void {
    this.eye[0] += x;
    this.eye[1] += y;
    this.eye[2] += z;
    this.refreshViewMatrix();
  }

  /**
   * Gets the combined view-projection matrix
   * @returns {Float32Array} View-projection matrix
   */
  public getViewProjectionMatrix(): Float32Array {
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(
      this.perspectiveMatrix,
      this.viewMatrix,
      viewProjectionMatrix
    );
    return viewProjectionMatrix;
  }

  /**
   * Gets the camera's target point
   * @returns {vec3.default} Target point
   */
  public getTarget(): vec3.default {
    return this.target;
  }

  /**
   * Gets the camera's position
   * @returns {vec3.default} Camera position
   */
  public getEye(): vec3.default {
    return this.eye;
  }

  /**
   * Converts radians to degrees
   * @param {number} rad - Angle in radians
   * @returns {number} Angle in degrees
   * @private
   */
  private radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  /**
   * Converts degrees to radians
   * @param {number} deg - Angle in degrees
   * @returns {number} Angle in radians
   * @private
   */
  private degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}

export default Camera;
