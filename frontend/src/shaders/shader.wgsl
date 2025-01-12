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
    change_stipple_size: f32, // 1.0: no change, (0, 1): change, (1, 2): change
};

@group(0) @binding(0) var<uniform> uniform_buffer: Uniform;

@vertex fn vs(
    vert: Vertex,
) -> VSOutput {
    var vsOut: VSOutput;

    var aspect = uniform_buffer.screen_size.x / uniform_buffer.screen_size.y;
//    var haha = uniform_buffer.mv_matrix;

    var new_offset_x = vert.offset.x * uniform_buffer.screen_size.x;
    var new_offset_y = vert.offset.y * uniform_buffer.screen_size.y;

    // move to center of screen
    new_offset_x -= uniform_buffer.screen_size.x / 2.0;
    new_offset_y -= uniform_buffer.screen_size.y / 2.0;


    var pos = vec4f(vert.position * vert.radius * 1 + vert.offset, 0.0, 1.0);
    pos = uniform_buffer.mv_matrix * pos;

    vsOut.position = pos;
    vsOut.color = vec4f(vert.density, 1.0, 1.0, 1.0);
    return vsOut;
}

@fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
    return vsOut.color;
}