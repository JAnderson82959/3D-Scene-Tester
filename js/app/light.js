'use strict'

import * as mat4 from '../lib/glmatrix/mat4.js'
import * as vec3 from '../lib/glmatrix/vec3.js'

import Box from './box3d.js'

class Light extends Box {
    constructor(id, color, intensity, target_shader, gl, shader, box_scale = [1,1,1]) {
        super( gl, shader, box_scale )

        this.id = id
        this.color = color
        this.intensity = intensity

        this.target_shader = target_shader
    }

    setTargetShader( shader ) {
        this.target_shader = shader
    }

    udpate( )
    {
        return
    }

    render( gl ) {
        this.shader.use( )
        this.shader.setUniform3f('u_color', this.color)
        this.shader.unuse( )

        super.render( gl )
    }
}

class AmbientLight extends Light {
    constructor(id, color, intensity, target_shader, gl, shader) {
        super(id, color, intensity, target_shader, gl, shader, [10000.0, 10000.0, 10000.0])
    }

    update( ) {
        this.target_shader.use()
        this.target_shader.setUniform3f(`u_lights_ambient[${this.id}].color`, this.color)
        this.target_shader.setUniform1f(`u_lights_ambient[${this.id}].intensity`, this.intensity)
        this.target_shader.unuse()
    }
}

class DirectionalLight extends Light {
    constructor(id, color, intensity, target_shader, gl, shader) {
        super(id, color, intensity, target_shader, gl, shader, [0.025, 0.25, 0.025])
    }

    update( ) {
        let transform = mat4.getRotation(mat4.create(), this.model_matrix)
        let direction = vec3.transformQuat(vec3.create(), [0.0,-1.0,0.0], transform)

        this.target_shader.use()
        this.target_shader.setUniform3f(`u_lights_directional[${this.id}].direction`, direction)
        this.target_shader.setUniform3f(`u_lights_directional[${this.id}].color`, this.color)
        this.target_shader.setUniform1f(`u_lights_directional[${this.id}].intensity`, this.intensity)
        this.target_shader.unuse()
    }
}

class PointLight extends Light {
    constructor(id, color, intensity, target_shader, gl, shader) {
        super(id, color, intensity, target_shader, gl, shader, [0.1, 0.1, 0.1])
    }

    update( ) {
        let position = mat4.getTranslation(vec3.create(), this.model_matrix)

        this.target_shader.use()
        this.target_shader.setUniform3f(`u_lights_point[${this.id}].position`, position)
        this.target_shader.setUniform3f(`u_lights_point[${this.id}].color`, this.color)
        this.target_shader.setUniform1f(`u_lights_point[${this.id}].intensity`, this.intensity)
        this.target_shader.unuse()
    }
}

export {
    Light,
    AmbientLight,
    DirectionalLight,
    PointLight
}
