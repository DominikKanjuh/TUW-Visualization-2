import {Stipple} from "./Stippling/Stipple";

export class Util {
    static createPipelineDescriptor_pos4_uv2(device: GPUDevice, shader_module: GPUShaderModule, vs_entry_point: string, fs_entry_point: string, format: GPUTextureFormat): GPURenderPipelineDescriptor {
        return {
            layout: 'auto',
            vertex: {
                module: shader_module,
                entryPoint: vs_entry_point,
                buffers: [
                    {
                        arrayStride: 6 * 4,
                        attributes: [
                            { // position
                                format: 'float32x4',
                                offset: 0,
                                shaderLocation: 0
                            },
                            { // uv
                                format: 'float32x2',
                                shaderLocation: 1,
                                offset: 4 * 4
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module: shader_module,
                entryPoint: fs_entry_point,
                targets: [{format: format}],
            },
        } as GPURenderPipelineDescriptor;
    }

    static minMaxOfArray(numbers: number[]): number[] {
        let min = Infinity;
        let max = -Infinity;
        for (const n of numbers) {
            min = Math.min(min, n);
            max = Math.max(max, n);
        }
        return [min, max];
    }

    static clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }

    static minMaxOfArray2D(array: number[][]): {min: number, max: number} {
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array[i].length; j++) {
                min = Math.min(min, array[i][j]);
                max = Math.max(max, array[i][j]);
            }
        }
        return {min, max};
    }
}