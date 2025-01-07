struct Uniforms {
    canvas_size: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read_write> outputBuffer: array<vec4<f32>>;

// 2D gradient
@compute @workgroup_size(16)
fn main(
    @builtin(global_invocation_id) gid: vec3<u32>,
    @builtin(workgroup_id) wid: vec3<u32>,
    @builtin(num_workgroups) num_wg: vec3<u32>
) {
    let width = uniforms.canvas_size.x;
    let height = uniforms.canvas_size.y;

    let pixel_x = f32(gid.x);
    let pixel_y = f32(gid.y);

    // Writing normalized coordinates to the buffer
    outputBuffer[gid.x + gid.y * u32(width)] = vec4<f32>(
        pixel_x / f32(width),
        pixel_y / f32(height),
        0.0,
        1.0
    );
}