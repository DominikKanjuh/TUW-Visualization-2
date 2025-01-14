/**
 * @fileoverview Handler for WebGPU buffer management and updates
 * @module frontend/Stippling/BufferHandler
 */

/**
 * Manages WebGPU buffer operations and change propagation
 * @class BufferHandler
 */
export class BufferHandler {
  /** WebGPU device instance */
  private device: GPUDevice;
  /** GPU buffer for storing vertex data */
  private gpuBuffer: GPUBuffer;
  /** Total allocated buffer length in bytes */
  private _totalBufferLength: number;
  /** Currently filled buffer length in bytes */
  private _filledBufferLength: number = 0;
  /** Function to call when buffer content changes */
  private propagate_change_func: Function;

  /**
   * Creates a new buffer handler
   * @constructor
   * @param {GPUDevice} device - WebGPU device instance
   * @param {GPUBuffer} gpuBuffer - GPU buffer for vertex data
   * @param {number} maxBufferLength - Maximum buffer length in bytes
   */
  constructor(
    device: GPUDevice,
    gpuBuffer: GPUBuffer,
    maxBufferLength: number
  ) {
    this.device = device;
    this.gpuBuffer = gpuBuffer;
    this._totalBufferLength = maxBufferLength;
    this._filledBufferLength = 0;
    this.propagate_change_func = () => {};
  }

  /**
   * Gets the total buffer length for a given buffer number
   * @param {number} buffer_num - Buffer index
   * @returns {number} Total buffer length in bytes
   */
  public getBufferLength(buffer_num: number): number {
    return this._totalBufferLength;
  }

  /**
   * Adds new data to the buffer
   * @param {Float32Array} data - New data to append to buffer
   */
  public addNewData(data: Float32Array): void {
    this._filledBufferLength += data.length;

    this.device.queue.writeBuffer(
      this.gpuBuffer,
      this._filledBufferLength * 4,
      data.buffer,
    );

    this.propagate_change_func();
  }

  /**
   * Clears the buffer content
   * Resets filled length and issues clear command
   */
  public clearBuffer(): void {
    this._filledBufferLength = 0;

    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.clearBuffer(this.gpuBuffer);
    this.device.queue.submit([commandEncoder.finish()]);

    this.propagate_change_func();
  }

  /**
   * Registers a function to be called when buffer content changes
   * @param {Function} func - Callback function for change events
   */
  public register_change(func: Function) {
    this.propagate_change_func = func;
  }

  /**
   * Exchanges current buffer data with new data
   * Clears buffer, adds new data, and waits for GPU operations to complete
   * @param {Float32Array} data - New data to replace current buffer content
   * @returns {Promise<void>} Promise that resolves when buffer update is complete
   */
  public async exchange_data(data: Float32Array) {
    this.clearBuffer();
    this.addNewData(data);

    this.propagate_change_func();
    // wait for the buffer to be written
    await this.device.queue.onSubmittedWorkDone();
  }

  /**
   * Replaces buffer data without waiting for GPU operations
   * @param {Float32Array} data - New data to replace current buffer content
   */
  replaceData(data: Float32Array) {
    this.clearBuffer();
    this.addNewData(data);
  }
}
