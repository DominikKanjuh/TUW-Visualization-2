export class BufferHandler {
    private device: GPUDevice;
    private gpuBuffer: GPUBuffer;
    private _totalBufferLength: number;
    private _filledBufferLength: number = 0;

    private propagate_change_func: Function;

    constructor(device: GPUDevice, gpuBuffer: GPUBuffer, maxBufferLength: number) {
        this.device = device;
        this.gpuBuffer = gpuBuffer;
        this._totalBufferLength = maxBufferLength;
        this._filledBufferLength = 0;
        this.propagate_change_func = () => {
        };
    }

    public getBufferLength(buffer_num: number): number {
        return this._totalBufferLength;
    }

    public addNewData(data: Float32Array): void {
        this._filledBufferLength += data.length;

        this.device.queue.writeBuffer(
            this.gpuBuffer,
            this._filledBufferLength * 4,
            data.buffer,
        );

        this.propagate_change_func();
    }

    public clearBuffer(): void {
        this._filledBufferLength = 0;

        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.clearBuffer(this.gpuBuffer);
        this.device.queue.submit([commandEncoder.finish()]);

        this.propagate_change_func();
    }

    public register_change(func: Function) {
        this.propagate_change_func = func;
    }

    public async exchange_data(data: Float32Array) {
        this.clearBuffer();
        this.addNewData(data);

        this.propagate_change_func();
        // wait for the buffer to be written
        await this.device.queue.onSubmittedWorkDone();
    }
}