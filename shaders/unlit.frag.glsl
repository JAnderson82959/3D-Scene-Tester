#version 300 es

precision mediump float;

const vec3 c_color_1 = vec3(30.0/255.0, 56.0/255.0, 136.0/255.0); // Aggie Blue
const vec3 c_color_2 = vec3(255.0/255.0,191.0/255.0, 0.0/255.0); // Aggie Gold

out vec4 o_fragColor;

void main() {
    float z = gl_FragCoord.w;
    vec3 c = mix(c_color_1, c_color_2, z);
    o_fragColor = vec4(c,1);
}