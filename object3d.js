'use strict'

import * as mat4 from './js/lib/glmatrix/mat4.js'

class Object3D
{
    constructor( gl, shader, vertices, indices, draw_mode, material = null )
    {
        this.shader = shader
        this.material = material

        this.vertices = vertices
        this.vertices_buffer = null
        this.createVBO( gl )

        this.indices = indices
        this.index_buffer = null
        this.createIBO( gl )

        this.draw_mode = draw_mode

        this.num_components_vec3 = 3
        this.num_components_vec2 = 2

        this.vertex_array_object = null
        this.createVAO( gl, shader )

        this.model_matrix = mat4.identity(mat4.create())
    }

    setShader( gl, shader ) {
        this.shader = shader
        gl.deleteVertexArray(this.vertex_array_object)
        this.createVAO( gl, shader )
    }

    setDrawMode( draw_mode ) {
        this.draw_mode = draw_mode
    }

    setTransformation( transformation ) {
        this.model_matrix = transformation
    }

    createVAO( gl, shader )
    {
        this.vertex_array_object = gl.createVertexArray();
        gl.bindVertexArray(this.vertex_array_object);
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices_buffer )

        let location = shader.getAttributeLocation( 'a_position' )
        let stride = 0, offset = 0
        if (location >= 0) {
            gl.enableVertexAttribArray( location )
            stride = 0, offset = 0
            gl.vertexAttribPointer( location, this.num_components_vec3, gl.FLOAT, false, stride, offset )
        }

        location = shader.getAttributeLocation( 'a_normal' )
        if (location >= 0) {
            gl.enableVertexAttribArray( location )
            stride = 0, offset = (this.vertices.length / 2) * Float32Array.BYTES_PER_ELEMENT
            gl.vertexAttribPointer( location, this.num_components_vec3, gl.FLOAT, false, stride, offset )
        }

        gl.bindVertexArray( null )
        gl.bindBuffer( gl.ARRAY_BUFFER, null )
    }

    createVBO( gl )
    {
        this.vertices_buffer = gl.createBuffer( );
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices_buffer )
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW )
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
    }

    createIBO( gl )
    {
        this.index_buffer = gl.createBuffer( );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer )
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW )
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    }

    udpate( ) 
    {
        return
    }

    render( gl )
    {
        gl.bindVertexArray( this.vertex_array_object )
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.index_buffer )

        this.shader.use( )
        this.shader.setUniform4x4f('u_m', this.model_matrix)

        gl.drawElements( this.draw_mode, this.indices.length, gl.UNSIGNED_INT, 0 )
        gl.bindVertexArray( null )
        gl.bindBuffer( gl.ARRAY_BUFFER, null )
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null )
        this.shader.unuse( )
    }

}

class ShadedObject3D extends Object3D { 
     constructor( gl, shader, vertices, indices, draw_mode, material ) {
        super(gl, shader, vertices, indices, draw_mode, material)
     }

    createVAO( gl, shader )
    {
        this.vertex_array_object = gl.createVertexArray();
        gl.bindVertexArray(this.vertex_array_object);
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vertices_buffer )

        let stride = 0, offset = 0
        let num_total_components = 6
        num_total_components += this.material.hasTexture() ? 5 : 0

        let location = shader.getAttributeLocation( 'a_position' )
        if (location >= 0) {
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec3, gl.FLOAT, false, 44, 0 );
        }

        location = shader.getAttributeLocation( 'a_normal' )
        if (location >= 0) {
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec3, gl.FLOAT, false, 44, 12 );
        }

        location = shader.getAttributeLocation( 'a_tangent' )
        if (location >= 0 && this.material.hasTexture()) {
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec3, gl.FLOAT, false, 44, 36 );
        }

        location = shader.getAttributeLocation( 'a_texture_coord' )
        if (location >= 0 && this.material.hasTexture()) {
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, this.num_components_vec2, gl.FLOAT, false, 44, 24 );
        }

        gl.bindVertexArray( null )
        gl.bindBuffer( gl.ARRAY_BUFFER, null )
    }

    render( gl )
    {
        this.shader.use( )
        this.shader.setUniform3f("u_material.kA", this.material.kA)
        this.shader.setUniform3f("u_material.kD", this.material.kD)
        this.shader.setUniform3f("u_material.kS", this.material.kS)
        this.shader.setUniform1f("u_material.shininess", this.material.shininess)
        gl.activeTexture(gl.TEXTURE0);

        if (this.material.hasMapKD()) {
            gl.bindTexture(gl.TEXTURE_2D, this.material.getMapKD())
            this.shader.setUniform1i("u_material.map_kD", 0)
        }

        if (this.material.hasMapNS()) {
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, this.material.getMapNS())
            this.shader.setUniform1i("u_material.map_nS", 1)
        }

        if (this.material.hasMapNorm()) {
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, this.material.getMapNorm())
            this.shader.setUniform1i("u_material.map_norm", 2)
            console.log("mapNorm", this.material.getMapNorm())
        }

        this.shader.unuse( )
        super.render( gl )
    }
}

export {
    Object3D,
    ShadedObject3D,
}