struct VertexIn {
    @location(0) position: vec4<f32>,
    @location(1) uv: vec2<f32>,
}

struct Fragment {
    @builtin(position) Position: vec4<f32>,
    @location(0) fragUV : vec2f,
};

struct Uniforms {
    canvas_size: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> inputBuffer: array<vec4<f32>>;

@vertex
fn vs_main(v: VertexIn) -> Fragment {
    var output = Fragment();
    output.Position = v.position;
    output.fragUV = v.uv;
    return output;
}

// 2D gradient
@fragment
fn fs_main(f: Fragment) -> @location(0) vec4<f32> {
    let width = uniforms.canvas_size.x;
    let height = uniforms.canvas_size.y;

    // Convert clip space coordinates to texture space coordinates
    let screen_x = u32(f.fragUV.x * width);
    let screen_y = u32(f.fragUV.y * height);

    // Calculate the index in the buffer
    let index = screen_y * u32(width) + screen_x;

    return inputBuffer[index];
}