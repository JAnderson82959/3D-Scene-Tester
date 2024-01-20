'use strict'

import { ShadedObject3D } from "../../object3d.js"
import { SHADER_MAX_LIGHTS, hex2rgb, json2transform } from "../utils/utils.js"
import * as mat4 from "../lib/glmatrix/mat4.js"

import { OBJLoader } from "../../objloader.js"
import { Light, AmbientLight, DirectionalLight, PointLight } from "./light.js"

class Scene {
    constructor(scene_config, gl, shader, light_shader) {
        this.scene_config = scene_config

        this.models = 'models' in scene_config ? this.loadModels(scene_config.models, gl) : {}

        this.lights = 'lights' in scene_config ? this.loadLights(scene_config.lights) : {}
        this.light_counts = {}
        this.resetLights( shader )

        this.scenegraph = this.loadScenegraphNode(scene_config.scenegraph, gl, shader, light_shader)

        this.scenegraph.setTransformation(this.scenegraph.transformation)
    }

    resetLights( shader ) {
        shader.use( )
        for (let i = 0; i < SHADER_MAX_LIGHTS; i++ ) {
            shader.setUniform3f(`u_lights_ambient[${i}].color`, [0,0,0])
            shader.setUniform1f(`u_lights_ambient[${i}].intensity`, 0.0)

            shader.setUniform3f(`u_lights_directional[${i}].direction`, [0,0,0])
            shader.setUniform3f(`u_lights_directional[${i}].color`, [0,0,0])
            shader.setUniform1f(`u_lights_directional[${i}].intensity`, 0.0)

            shader.setUniform3f(`u_lights_point[${i}].position`, [0,0,0])
            shader.setUniform3f(`u_lights_point[${i}].color`, [0,0,0])
            shader.setUniform1f(`u_lights_point[${i}].intensity`, 0.0)
        }
        shader.unuse( )
    }

    loadModels( models_config, gl ) {
        let models = {}

        for (let model_config of models_config) {
            let loader = new OBJLoader(model_config.obj)
            models[model_config.name] = loader.load(gl)
        }

        return models
    }

    loadLights( lights_config ) {
        let lights = {}

        for (let light_config of lights_config) {
            // Load the light
            lights[light_config.name] = light_config            
        }

        return lights
    }

    instantiateModel( name, gl, shader ) {
        if (!(name in this.models))
            throw `Unable to find model "${name}" requested by scenengraph`

        let [ vertices, indices, material ] = this.models[name]

        return new ShadedObject3D( gl, shader, vertices, indices, gl.TRIANGLES, material )
    }

    instantiateLight( name, gl, shader, light_shader ) {
        if (!(this.lights[name].type in this.light_counts))
            this.light_counts[this.lights[name].type] = -1
        this.light_counts[this.lights[name].type] += 1

        let light = this.lights[name]

        let color = light.color[0] == '#' ? hex2rgb(light.color) : light.color

        switch(light.type) {
            case 'ambient':
                return new AmbientLight( this.light_counts[this.lights[name].type], color, light.intensity, shader, gl, light_shader )

            case 'point':
                return new PointLight( this.light_counts[this.lights[name].type], color, light.intensity, shader, gl, light_shader )

            case 'directional':
                return new DirectionalLight( this.light_counts[this.lights[name].type], color, light.intensity, shader, gl, light_shader )
        }
    }

    loadScenegraphNode( node_config, gl, shader, light_shader ) {
        let node = null

        // Check the node's type
        switch(node_config.type) {
            case 'node':
                node = new SceneNode(
                    node_config.name, 
                    node_config.type, 
                    'transformation' in node_config ? json2transform(node_config.transformation) : mat4.create()
                )
                break
            case 'model':
                node = new ModelNode(
                    this.instantiateModel(node_config.content, gl, shader), // Field "content" refers to the model to be associated with this node
                    node_config.name,
                    node_config.type,
                    'transformation' in node_config ? json2transform(node_config.transformation) : mat4.create()
                )
                break
            case 'light':
                node = new LightNode(
                    this.instantiateLight(node_config.content, gl, shader, light_shader), // Field "content" refers to the light to be associated with this node
                    node_config.name,
                    node_config.type,
                    'transformation' in node_config ? json2transform(node_config.transformation) : mat4.create()
                )
                break
        }

        if ('children' in node_config) {
            for (let child of node_config.children) {

                let child_node = this.loadScenegraphNode(child, gl, shader, light_shader)

                node.addChild(child_node)

                child_node.setParent(node)
            }
        }

        return node
    }

    getNodes( ) {
        let nodes = this.scenegraph.getNodes( [] )
        return nodes
    }

    getNode( name ) {
        let node = this.scenegraph.getNode( name )
        if (node == null)
            throw `Node "${name}" not found in scenegraph`
        return node
    }

    render( gl ) {
        this.scenegraph.render( gl )
    }
}

class SceneNode {

    constructor( name, type, transformation ) {
        this.name = name
        this.type = type
        this.transformation = transformation
        this.world_transformation = this.calculateWorldTransformation()
        this.parent = null
        this.children = []
    }

    getWorldTransformation() {
        return this.world_transformation
    }

    calculateWorldTransformation() {
        let transformations = this.getTransformationHierarchy([])
        let world = mat4.create()
        for (let transformation of transformations) {
            world = mat4.multiply(mat4.create(), transformation, world)
        }

        return world
    }

    getTransformationHierarchy( transformations ) {
        transformations.push( this.transformation )
        if (this.parent != null)
            this.parent.getTransformationHierarchy( transformations )
        
        return transformations
    }

    getTransformation( ) {
        return this.transformation
    }

    setTransformation( transformation ) {
        this.transformation = transformation
        for (let child of this.children) 
            child.setTransformation(child.transformation)
        this.world_transformation = this.calculateWorldTransformation()
    }

    getParent( ) {
        return this.parent
    }

    setParent( node ) {
        this.parent = node
    }

    addChild( node ) {
        this.children.push(node)
    }

    getNodes( nodes ) {
        nodes.push(this)
        for (let child of this.children)
            child.getNodes( nodes )
        return nodes
    }

    getNode( name ) {
        if (this.name == name)
            return this
        
        for (let child of this.children) {
            let node = child.getNode( name )
            if (node != null)
                return node
        }

        return null
    }

    render( gl ) {
        for (let child of this.children) {
            child.render( gl )
        }
    }
}

class ModelNode extends SceneNode {

    constructor( obj3d, name, type, transformation ) {
        super(name, type, transformation)

        this.obj3d = obj3d
    }

    setDrawMode( draw_mode ) {
        this.obj3d.setDrawMode( draw_mode )
    }

    setTransformation( transformation ) {
        super.setTransformation( transformation )

        this.obj3d.setTransformation(this.world_transformation)
    }

    setShader( gl, shader ) {
        this.obj3d.setShader( gl, shader )
    }

    render( gl ) {
        this.obj3d.render( gl )
        super.render( gl )
    }
}

class LightNode extends SceneNode {

    constructor( light, name, type, transformation ) {
        super( name, type, transformation )

        this.light = light
    }

    setTransformation( transformation ) {
        super.setTransformation( transformation )

        this.light.setTransformation(this.world_transformation)
        this.light.update( )
    }

    setTargetShader( shader ) {
        this.light.setTargetShader( shader )
        this.light.update( )
    }

    render( gl ) {
        this.light.render( gl )
        super.render( gl )
    }
}

export {
    Scene,
    SceneNode
}