'use strict'

import { Object3D } from '../../object3d.js'

class Box extends Object3D {
    constructor( gl, shader, box_scale = [1,1,1] ) 
    {
        let vertices = [
            1.000000, 1.000000, -1.000000,
            1.000000, -1.000000, -1.000000,
            1.000000, 1.000000, 1.000000,
            1.000000, -1.000000, 1.000000,
            -1.000000, 1.000000, -1.000000,
            -1.000000, -1.000000, -1.000000,
            -1.000000, 1.000000, 1.000000,
            -1.000000, -1.000000, 1.000000
        ]

        for (let i = 0; i < vertices.length; i++) {
            vertices[i] = vertices[i] * box_scale[i%3]
        }

        let indices = [
            0, 1,
            1, 3,
            3, 2,
            2, 0,

            0, 4,
            1, 5,
            2, 6,
            3, 7,

            4, 5,
            5, 7,
            7, 6,
            6, 4
        ]
        
        super( gl, shader, vertices, indices, gl.LINES )
    }

    udpate( ) 
    {
        return
    }
}

export default Box