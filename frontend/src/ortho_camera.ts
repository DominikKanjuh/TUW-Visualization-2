/**
 * @fileoverview Orthographic camera implementation for 2D visualization
 * @module frontend/ortho_camera
 */

import { mat4, vec3 } from "webgpu-matrix";

/**
 * Orthographic camera class for 2D scene viewing
 * Handles view and projection matrices for orthographic projection
 * @class OrthoCamera
 */
export class OrthoCamera {
  /** Projection matrix for orthographic view */
  private projectionMatrix: Float32Array;
  /** View matrix for camera position and orientation */
  private viewMatrix: Float32Array;

  /** Camera position in world space */
  private eye: vec3.default;
  /** Point the camera is looking at */
  private target: vec3.default;
  /** Up vector for camera orientation */
  private up: vec3.default;

  /** Aspect ratio of the viewport */
  private aspect: number;
  /** Left bound of the orthographic frustum */
  private left: number;
  /** Right bound of the orthographic frustum */
  private right: number;
  /** Bottom bound of the orthographic frustum */
  private bottom: number;
  /** Top bound of the orthographic frustum */
  private top: number;

  /**
   * Creates a new orthographic camera
   * @constructor
   * @param {number} left - Left bound of view frustum
   * @param {number} right - Right bound of view frustum
   * @param {number} bottom - Bottom bound of view frustum
   * @param {number} top - Top bound of view frustum
   * @param {number} near - Near clipping plane
   * @param {number} far - Far clipping plane
   * @param {vec3.default} [eye=[0,0,-3]] - Camera position
   * @param {vec3.default} [target=[0,0,1]] - Look-at target
   * @param {vec3.default} [up=[0,1,0]] - Up vector
   */
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

  /**
   * Updates the view matrix based on current camera position
   */
  public refreshViewMatrix(): void {
    mat4.lookAt(this.eye, this.target, this.up, this.viewMatrix);
  }

  /**
   * Updates the projection matrix with current frustum bounds
   */
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

  /**
   * Gets the current zoom level based on frustum width
   * @returns {number} Current zoom level
   * @private
   */
  private getZoomLevel(): number {
    return (this.right - this.left) / 2;
  }

  /**
   * Translates the camera in world space
   * @param {number} x - X-axis translation
   * @param {number} y - Y-axis translation
   * @param {number} z - Z-axis translation (triggers zoom if non-zero)
   */
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

  /**
   * Maps orthographic bounds to latitude/longitude coordinates
   * @returns {Object} Object containing min/max latitude and longitude
   */
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

  /**
   * Zooms the camera by adjusting the orthographic frustum
   * @param {number} zoom - Zoom factor (positive = zoom in, negative = zoom out)
   */
  public zoomCamera(zoom: number): void {
    const speed = this.getZoomLevel() * 0.05;

    this.left += zoom * this.aspect * speed;
    this.right -= zoom * this.aspect * speed;
    this.bottom += zoom * speed;
    this.top -= zoom * speed;
  }

  /**
   * Clamps a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {number} Clamped value
   * @private
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Gets the combined view-projection matrix
   * @returns {Float32Array} View-projection matrix
   */
  public getViewProjectionMatrix(): Float32Array {
    const viewProjectionMatrix = mat4.create();
    mat4.multiply(this.projectionMatrix, this.viewMatrix, viewProjectionMatrix);
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
