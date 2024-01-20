'use strict'

import Input from '../input/input.js'
import AppState from './appstate.js'
import Shader from '../utils/shader.js'
import WebGlApp from './webglapp.js'

class App
{

    constructor( )
    {

        console.log( 'Initializing App' )

        this.canvas = document.getElementById( 'canvas' )
        this.canvas.addEventListener( 'contextmenu', event => event.preventDefault( ) );
        this.gl = this.initGl( )

        console.log( 'Loading Shaders' )
        this.shaders = [
            new Shader( this.gl, '../../shaders/unlit.vert.glsl', '../../shaders/unlit.frag.glsl' ),
            new Shader( this.gl, '../../shaders/phong.vert.glsl', '../../shaders/phong.frag.glsl' ),
            new Shader( this.gl, '../../textured.vert.glsl', '../../textured.frag.glsl' ),
            new Shader( this.gl, '../../shaders/lights.vert.glsl', '../../shaders/lights.frag.glsl' )
        ]

        this.resizeToDisplay( )
        this.initial_width = this.canvas.width
        this.initial_height = this.canvas.height
        window.onresize = this.resizeToDisplay.bind( this )

        this.last_tick = Date.now() / 1000.0
        this.delta_time = 0
        this.app_state = new AppState( )
        this.impl = new WebGlApp( this.gl, this.shaders, this.app_state )

    }

    /**
     * Initializes webgl2 with settings
     * @returns { WebGL2RenderingContext | null } The WebGL2 context or Null
     */
    initGl( )
    {
        let canvas = document.getElementById('canvas')
        return canvas.getContext('webgl2')
    }

    resizeToDisplay( )
    {

        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight

    }

    start( )
    {

        requestAnimationFrame( ( ) =>
        {

            this.update( )

        } )

    }

    update( )
    {
        this.delta_time = (Date.now() / 1000.0) - this.last_tick
        this.last_tick = Date.now() / 1000.0

        this.app_state.update( )
        Input.update( )

        this.impl.update( this.gl, this.app_state, this.delta_time )
        this.render( )
        requestAnimationFrame( ( ) =>
        {

            this.update( )

        } )

    }

    render( )
    {
        this.impl.render( this.gl, this.canvas.width, this.canvas.height )
    }

}


export default App
