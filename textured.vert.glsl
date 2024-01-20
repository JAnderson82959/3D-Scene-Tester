#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_texture_coord;

uniform mat4x4 u_m;
uniform mat4x4 u_v;
uniform mat4x4 u_p;

out vec3 vertpos;
out vec2 texcord;
out vec3 tanfragpos;
out mat3 tbn;
out mat4x4 mv;

void main() {
    vec4 vertex_position_world = u_m * vec4(a_position, 1.0);

    vec3 T = normalize(vec3(u_m * vec4(a_tangent, 0.0)));
    vec3 N = normalize(vec3(u_m * vec4(a_normal, 0.0)));
    T = normalize(T - dot(T,N) * N);
    vec3 B = cross(N, T);
    tbn = mat3(T, B, N);

    tanfragpos = tbn * vec3(vertex_position_world); 

    texcord = a_texture_coord;
    vertpos = vec3(vertex_position_world);//vec3(u_p * u_v * vertex_position_world);
    mv = u_v * u_m;

    gl_Position = u_p * u_v * vertex_position_world;

}