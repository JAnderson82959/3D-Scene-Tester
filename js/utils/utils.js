'use strict'

import * as mat4 from '../lib/glmatrix/mat4.js'
import * as vec3 from '../lib/glmatrix/vec3.js'
import * as quat4 from '../lib/glmatrix/quat.js'

const SHADER_MAX_LIGHTS = 16

function loadExternalFile( url )
{

    let req = new XMLHttpRequest( );
    req.open( 'GET', url, false );
    req.send( null );

    return ( req.status == 200 ) ? req.responseText : null;

}

function hex2rgb( hex )
{

    let rgb = hex.match( /\w\w/g )
        .map( x => parseInt( x, 16 ) / 255 );

    return [ rgb[ 0 ], rgb[ 1 ], rgb[ 2 ] ]

}

function deg2rad( deg ) {
    return deg * (Math.PI / 180)
}

function getRelativeMousePosition( event )
{

    let target = event.target

    if ( target.id != 'canvas' )
    {
        return {

            x: null,
            y: null,

        }

    }

    target = target || event.target;
    let rect = target.getBoundingClientRect( );

    return {

        x: event.clientX - rect.left,
        y: event.clientY - rect.top,

    }

}

 function json2transform( transform_config ) {

    let rotation = 'rotation' in transform_config ? transform_config.rotation : quat4.create()
    let translation = 'translation' in transform_config ? transform_config.translation : vec3.create()
    let scale = 'scale' in transform_config ? transform_config.scale : [1,1,1]

    if (rotation.length == 3)
        rotation = quat4.fromEuler( quat4.create(), rotation[0], rotation[1], rotation[2] )

    return mat4.fromRotationTranslationScale(mat4.create(), 
        rotation,
        translation,
        scale
    )
}

function getFileDir(path) {
    let components = path.split('/')
    components.pop()

    let result = components.join('/')

    return result
}

export
{
    
    SHADER_MAX_LIGHTS,
    loadExternalFile,
    hex2rgb,
    deg2rad,
    getRelativeMousePosition,
    json2transform,
    getFileDir

}
