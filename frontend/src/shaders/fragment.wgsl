@fragment
fn main(
    @builtin(position) frag_coord: vec4<f32>,
    @location(0) density: f32,
    @location(1) radius: f32
) -> @location(0) vec4<f32> {
    // Compute the distance from the center of the stipple
    let dist = length(frag_coord.xy - vec2<f32>(0.0, 0.0)); // Frag coord in local stipple space

    // Discard fragments outside the stipple's radius
    if (dist > radius) {
        discard;
    }

    // Modulate the color by the stipple's density
    let color = vec3<f32>(1.0 - density, 1.0, 1.0 - density);
    return vec4<f32>(color, 1.0);
}
