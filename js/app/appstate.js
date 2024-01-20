'use strict'

import Input from '../input/input.js'

class AppState
{

    constructor( )
    {
        this.ui_categories = {
            'Shading':
            {
                'Phong': document.getElementById( 'shadingPhong' ),
                'Textured': document.getElementById( 'shadingTextured' ),
            },
            'Shading Debug': {
                'Normals': document.getElementById( 'shadingDebugNormals' ),
            },
            'Control':
            {
                'Camera': document.getElementById( 'controlCamera' ),
                'Scene Node': document.getElementById( 'controlSceneNode' )
            },
            'Select Scene Node': document.getElementById( 'selectSceneNodeSelect' ),
            '3D Scene': document.getElementById( 'openfileActionInput' )
        }

        this.ui_state = {
            'Shading': '',
            'Control': '',
            'Select Scene Node': ''
        }

        this.updateUI( 'Shading', 'Phong' )
        this.updateUI( 'Shading Debug', '' )
        this.updateUI( 'Control', 'Camera' )
        
        this.ui_categories['Select Scene Node'].onchange = () => {
            this.ui_state['Select Scene Node'] = this.ui_categories['Select Scene Node'].value
        }
        this.onOpen3DSceneCallback = null
        this.ui_categories['3D Scene'].onchange = (evt) => {
            if (this.onOpen3DSceneCallback == null)
                return
            
            let scene = this.onOpen3DSceneCallback(evt.target.files[0].name)
            this.ui_categories['Select Scene Node'].innerHTML = ''
            for (let node of scene.getNodes()) {
                let option = document.createElement('option')
                option.value = node.name
                option.innerHTML = node.name
                this.ui_categories['Select Scene Node'].appendChild(option)
            }
            this.ui_categories['Select Scene Node'].removeAttribute('disabled')
            this.ui_categories['Select Scene Node'].value = this.ui_categories['Select Scene Node'].getElementsByTagName('option')[0].value
            this.ui_state['Select Scene Node'] = this.ui_categories['Select Scene Node'].value
        }
    }

    onOpen3DScene(callback) {
        this.onOpen3DSceneCallback = callback
    }

    getState( name )
    {
        return this.ui_state[name]
    }

    update( )
    {
        if ( Input.isKeyPressed( 'c' ) ) {
            this.updateUI( 'Shading', 'Phong' )
        } else if ( Input.isKeyPressed( 'v' ) ) {
            this.updateUI( 'Shading', 'Textured' )
        }

        if ( Input.isKeyDown( 'n' ) ) {
            this.updateUI( 'Shading Debug', 'Normals' )
        } else {
            this.updateUI( 'Shading Debug', '' )
        }

        if ( Input.isKeyDown( 'q' ) ) {
            this.updateUI( 'Control', 'Scene Node')
        } else {
            this.updateUI( 'Control', 'Camera')
        }

    }

    updateUI( category, name, value = null )
    {
        this.ui_state[category] = name
        for ( let key in this.ui_categories[ category ] )
        {

            this.updateUIElement( this.ui_categories[ category ][ key ], key == name, value )

        }

    }

    updateUIElement( el, state, value )
    {

        el.classList.remove( state ? 'inactive' : 'active' )
        el.classList.add( state ? 'active' : 'inactive' )

        if ( state && value != null )
            el.innerHTML = value

    }

}

export default AppState
