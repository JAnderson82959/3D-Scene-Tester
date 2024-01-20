#version 300 es

in vec3 a_position;
in vec3 a_normal;

uniform mat4x4 u_m;
uniform mat4x4 u_v;
uniform mat4x4 u_p;

out vec3 o_vertex_normal_world;
out vec3 o_vertex_position_world;

void main() {
    vec4 vertex_position_world = u_m * vec4(a_position, 1.0);

    mat3 norm_matrix = transpose(inverse(mat3(u_m)));
    vec3 vertex_normal_world = normalize(norm_matrix * a_normal);
    gl_Position = u_p * u_v * vertex_position_world;

    o_vertex_normal_world = vertex_normal_world.xyz;
    o_vertex_position_world = vertex_position_world.xyz;

}