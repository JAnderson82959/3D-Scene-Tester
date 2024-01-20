'use strict'

class Texture {

    constructor(filename, gl, flip_y = true) {
        this.filename = filename 
        this.texture = null
        this.texture = this.createTexture( gl, flip_y )
    }

    getGlTexture() {
        return this.texture
    }

    createTexture( gl, flip_y ) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip_y)

        let texture = gl.createTexture()
    
        const level = 0     
        const internal_format = gl.UNSIGNED_SHORT_4_4_4_4    
        const src_format = gl.UNSIGNED_SHORT_4_4_4_4            
        const src_type = gl.UNSIGNED_BYTE               
    
        const image = new Image();
        image.onload = () => {
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
            gl.generateMipmap(gl.TEXTURE_2D)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
            gl.bindTexture(gl.TEXTURE_2D, null)      
        }
        image.src = this.filename
    
        return texture
    }
}

export default Texture