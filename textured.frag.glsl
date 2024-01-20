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
    sampler2D map_kD;
    sampler2D map_nS;
    sampler2D map_norm;
};

uniform AmbientLight u_lights_ambient[MAX_LIGHTS];
uniform DirectionalLight u_lights_directional[MAX_LIGHTS];
uniform PointLight u_lights_point[MAX_LIGHTS];

uniform Material u_material;

uniform vec3 u_eye;

out vec4 o_fragColor;

in vec3 vertpos;
in vec2 texcord;
in vec3 tanfragpos;
in mat3 tbn;
in mat4x4 mv;
in vec3 normal;

vec3 shadeAmbientLight(Material material, AmbientLight light) {
    return light.color * light.intensity * material.kA * vec3(texture(material.map_kD, texcord).rgb);
}

vec3 shadeDirectionalLight(Material material, DirectionalLight light, vec3 normal, vec3 eye, vec3 vertex_position) {
    vec3 result = vec3(0);
    if (light.intensity == 0.0)
        return result;

    vec3 N = normalize(normal);
    vec3 L = -normalize(light.direction);
    vec3 V = normalize(vertex_position - eye);

    float LN = max(dot(L, N), 0.0);
    result += LN * light.color * light.intensity * material.kD * vec3(texture(material.map_kD, texcord).rgb);

    vec3 R = reflect(L, N);
    result += pow( max(dot(R, V), 0.0), material.shininess * texture(material.map_nS, texcord)[3]) * light.color * light.intensity * material.kS;

    return result;
}

// Shades a point light and returns its contribution
vec3 shadePointLight(Material material, PointLight light, vec3 normal, vec3 eye, vec3 vertex_position) {
    vec3 result = vec3(0);
    if (light.intensity == 0.0)
        return result;

    vec3 N = normalize(normal);
    float D = distance(light.position, vertex_position);
    vec3 L = normalize(light.position - vertex_position);
    vec3 V = normalize(vertex_position - eye);

    // Diffuse
    float LN = max(dot(L, N), 0.0);
    result += LN * light.color * light.intensity * material.kD * vec3(texture(material.map_kD, texcord).rgb);

    // Specular
    vec3 R = reflect(L, N);
    result += pow( max(dot(R, V), 0.0), material.shininess* texture(material.map_nS, texcord)[3]) * light.color * light.intensity * material.kS;

    // Attenuation
    result *= 1.0 / (D*D+1.0);

    return result;
}

void main() {
    vec3 normal = texture(u_material.map_norm, texcord).rgb;
    normal = normal * 2.0 - 1.0;   
    normal = normalize(tbn * normal);

    if (u_show_normals == true) {
        o_fragColor = vec4(normal, 1.0);
        return;
    }

    vec3 light_contribution = vec3(0.0);

    for(int i = 0; i < MAX_LIGHTS; i++) {
        light_contribution = light_contribution + shadeAmbientLight(u_material, u_lights_ambient[i]);
        light_contribution += shadeDirectionalLight(u_material, u_lights_directional[i], normal, u_eye, vertpos);
        light_contribution += shadePointLight(u_material, u_lights_point[i], normal, u_eye, vertpos);
    }

    o_fragColor = vec4(light_contribution, 1.0);
}