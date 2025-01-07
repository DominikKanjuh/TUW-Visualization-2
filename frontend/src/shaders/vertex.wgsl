struct Stipple {
    x: f32,
    y: f32,
    density: f32,
    radius: f32,
};

struct Uniforms {
    min_x: f32,
    max_x: f32,
    min_y: f32,
    max_y: f32,
    screen_width: f32,
    screen_height: f32,
};

@group(0) @binding(0) var<storage, read> stipples: array<Stipple>;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) density: f32,
    @location(1) radius: f32,
};

@vertex
fn main(@builtin(instance_index) instance_index: u32) -> VertexOutput {
    let stipple = stipples[instance_index];

    // Normalize stipple position to [-1, 1] range for NDC
    let normalized_x = (stipple.x - uniforms.min_x) / (uniforms.max_x - uniforms.min_x) * 2.0 - 1.0;
    let normalized_y = (stipple.y - uniforms.min_y) / (uniforms.max_y - uniforms.min_y) * 2.0 - 1.0;

    // Convert radius to NDC space
    let scale_x = 2.0 / (uniforms.max_x - uniforms.min_x);
    let scale_y = 2.0 / (uniforms.max_y - uniforms.min_y);
    let radius_ndc = stipple.radius * max(scale_x, scale_y);

    var output: VertexOutput;
    output.position = vec4<f32>(normalized_x, normalized_y, 0.0, 1.0);
    output.density = stipple.density;
    output.radius = radius_ndc;
    return output;
}
