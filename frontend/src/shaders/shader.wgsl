struct Vertex {
    @location(0) position: vec2f,
    @location(1) density: f32,
    @location(2) offset: vec2f,
    @location(3) radius: f32,
};

struct VSOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
};

struct Uniform {
    screen_size: vec4f,
    mv_matrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> uniform_buffer: Uniform;

@vertex fn vs(
    vert: Vertex,
) -> VSOutput {
    var vsOut: VSOutput;

    var aspect = uniform_buffer.screen_size.x / uniform_buffer.screen_size.y;
//    var haha = uniform_buffer.mv_matrix;

    var pos = vec4f(vert.position * vert.radius + vert.offset, 0.0, 1.0);
    pos = uniform_buffer.mv_matrix * pos;

    vsOut.position = pos;
    vsOut.color = vec4f(vert.density, 1.0, 1.0, 1.0);
    return vsOut;
}

@fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
    return vsOut.color;
}