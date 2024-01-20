#version 300 es

#define MAX_LIGHTS 16

precision mediump float;

uniform bool u_show_normals;

struct AmbientLight {
    vec3 color;
    float intensity;
};

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};

struct PointLight {
    vec3 position;
    vec3 color;
    float intensity;
};

struct Material {
    vec3 kA;
    vec3 kD;
    vec3 kS;
    float shininess;
};

uniform AmbientLight u_lights_ambient[MAX_LIGHTS];
uniform DirectionalLight u_lights_directional[MAX_LIGHTS];
uniform PointLight u_lights_point[MAX_LIGHTS];
uniform Material u_material;
uniform vec3 u_eye;

in vec3 o_vertex_normal_world;
in vec3 o_vertex_position_world;

out vec4 o_fragColor;

vec3 shadeAmbientLight(Material material, AmbientLight light) {
    if (light.intensity == 0.0)
        return vec3(0);

    return light.color * light.intensity * material.kA;
}

vec3 shadeDirectionalLight(Material material, DirectionalLight light, vec3 normal, vec3 eye, vec3 vertex_position) {
    vec3 result = vec3(0);
    if (light.intensity == 0.0)
        return result;

    vec3 N = normalize(normal);
    vec3 L = -normalize(light.direction);
    vec3 V = normalize(vertex_position - eye);

    float LN = max(dot(L, N), 0.0);
    result += LN * light.color * light.intensity * material.kD;

    vec3 R = reflect(L, N);
    result += pow( max(dot(R, V), 0.0), material.shininess) * light.color * light.intensity * material.kS;


    return result;
}

vec3 shadePointLight(Material material, PointLight light, vec3 normal, vec3 eye, vec3 vertex_position) {
    vec3 result = vec3(0);
    if (light.intensity == 0.0)
        return result;

    vec3 N = normalize(normal);
    float D = distance(light.position, vertex_position);
    vec3 L = normalize(light.position - vertex_position);
    vec3 V = normalize(vertex_position - eye);

    float LN = max(dot(L, N), 0.0);
    result += LN * light.color * light.intensity * material.kD;

    vec3 R = reflect(L, N);
    result += pow( max(dot(R, V), 0.0), material.shininess) * light.color * light.intensity * material.kS;

    result *= 1.0 / (D*D+1.0);

    return result;
}

void main() {
    if (u_show_normals) {
        o_fragColor = vec4(o_vertex_normal_world, 1.0);
        return;
    }

    vec3 light_contribution = vec3(0.0);

    for(int i = 0; i < MAX_LIGHTS; i++) {
        light_contribution += shadeAmbientLight(u_material, u_lights_ambient[i]);
        light_contribution += shadeDirectionalLight(u_material, u_lights_directional[i], o_vertex_normal_world, u_eye, o_vertex_position_world);
        light_contribution += shadePointLight(u_material, u_lights_point[i], o_vertex_normal_world, u_eye, o_vertex_position_world);
    }

    o_fragColor = vec4(light_contribution, 1.0);
}