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
    change_stipple_size: vec4<f32>, // first value [0, 1]: 0: no change, 1: change with density, second value [0,10]: multiply with radius
    color1: vec4<f32>,              // first color for blending
    color2: vec4<f32>,              // second color for blending
    stops: vec2<f32>,               // stops for blending
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

    // change by density
    var css = uniform_buffer.change_stipple_size.x;
    // overall multiplier
    var csm = uniform_buffer.change_stipple_size.y;

    var pos = vec4f();
    if (css == 0.0) {
        pos = vec4f(vert.position * vert.radius * csm + vert.offset, 0.0, 1.0);
    } else {
        pos = vec4f(vert.position * vert.radius * csm * vert.density + vert.offset, 0.0, 1.0);
    }
//    pos = pos.yxzw;
    pos = uniform_buffer.mv_matrix * pos;

    vsOut.position = pos;
    vsOut.color = vec4f(vert.density, 1.0, 1.0, 1.0);
    return vsOut;
}

@fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
    var density = vsOut.color.x;
    return color_ramp(density);
}

fn color_ramp(input: f32) -> vec4f {
    let black = vec4f(0.0, 0.0, 0.0, 1.0);
    let white = vec4f(1.0, 1.0, 1.0, 1.0);

    if (input <= uniform_buffer.stops.x) {
        return mix(black, uniform_buffer.color1, input / uniform_buffer.stops.x);
    } else if (input <= uniform_buffer.stops.y) {
        return mix(uniform_buffer.color1, uniform_buffer.color2, (input - uniform_buffer.stops.x) / (uniform_buffer.stops.y - uniform_buffer.stops.x));
    } else {
        return mix(uniform_buffer.color2, white, (input - uniform_buffer.stops.y) / (1.0 - uniform_buffer.stops.y));
    }
}
