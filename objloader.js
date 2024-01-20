'use strict'

import { loadExternalFile, getFileDir } from './js/utils/utils.js'
import { MTLLoader } from './mtlloader.js'
import Material from './js/app/material.js'

import * as vec3 from './js/lib/glmatrix/vec3.js'
import * as vec2 from './js/lib/glmatrix/vec2.js'

class OBJLoader {
    constructor(filename) {
        this.filename = filename
    }

    load( gl ) {
        let contents = loadExternalFile(this.filename)
        let vertex_positions = []
        let vertex_texture_coords = []
        let vertex_normals = []
        let vertex_tangents = []
        let position_indices = []
        let texture_coord_indices = []
        let normal_indices = []
        let materials = {}
        let material = new Material([0.2,0.2,0.2], [0.5,0.5,0.5], [0.3,0.3,0.3], 20.0)

        for (let line of contents.split('\n')){
            let token = line.split(' ')[0]
            switch(token) {
                case 'mtllib':
                    let file = line.split(' ')[1]
                    let filepath = getFileDir(this.filename)
                    let loader = new MTLLoader(`${filepath}/${file}`)
                    materials = loader.load( gl )
                    break
                case 'usemtl':
                    let material_name = line.split(' ')[1]
                    if (!(material_name in materials))
                        throw `OBJ requested material "${material_name}" which is not defined by MTL`
                    material = materials[material_name]
                    break
                case 'v':
                    vertex_positions.push(...this.parseVertex(line))
                    break
                case 'vt':
                    vertex_texture_coords.push(...this.parseTextureCoord(line))
                    break
                case 'vn':
                    vertex_normals.push(...this.parseNormal(line))
                    break
                case 'f':
                    position_indices.push(...this.parseFace(line, 0))
                    texture_coord_indices.push(...this.parseFace(line, 1))
                    normal_indices.push(...this.parseFace(line, 2))
                    break
            }
        }

        if (material.hasTexture() && vertex_texture_coords.length <= 0)
            throw `Object "${this.filename}" requests texture but defines no texture coordinates`

        let max_extent = -Infinity
        let min_extent = Infinity
        for (let v of vertex_positions) {
            if (v > max_extent) max_extent = v
            if (v < min_extent) min_extent = v
        }

        let total_extent = max_extent - min_extent
        for (let i = 0; i < vertex_positions.length; i++) {
            vertex_positions[i] = 2 * ( (vertex_positions[i] - min_extent) / total_extent ) - 1.0
        }

        [vertex_positions, vertex_normals, vertex_texture_coords, position_indices] = this.resolveIndexGroups(vertex_positions, vertex_normals, vertex_texture_coords, position_indices, normal_indices, texture_coord_indices)
        let vertex_data = []
        let lene = (vertex_positions.length / 3)
        if (material.hasTexture()) {
            
            vertex_tangents = this.calculateTangents(vertex_positions, vertex_texture_coords, position_indices)
            
            for (let each = 0; each < lene; each++) {
                vertex_data.push(vertex_positions[each * 3 +0], vertex_positions[each * 3 +1], vertex_positions[each * 3 +2],
                                    vertex_normals[each * 3 +0], vertex_normals[each * 3 +1], vertex_normals[each * 3 +2],
                                    vertex_texture_coords[each * 2 +0], vertex_texture_coords[each * 2 +1],
                                    vertex_tangents[each * 3 +0], vertex_tangents[each * 3 +1], vertex_tangents[each * 3 +2])
            }
        } else {
            for (let each = 0; each < lene; each++) {
                vertex_data.push(vertex_positions[each * 3 + 0], vertex_positions[each * 3 +1], vertex_positions[each * 3 +2],
                                    vertex_normals[each * 3 +0], vertex_normals[each * 3 +1], vertex_normals[each * 3 +2],
                                    0.0, 0.0, 0.0, 0.0, 0.0,)
        }}
        console.log([ vertex_data, position_indices, material ])
        return [ vertex_data, position_indices, material ]
    }

     resolveIndexGroups(vertex_positions, vertex_normals, vertex_texture_coords, position_indices, normal_indices, texture_coord_indices) 
     {
         if (position_indices.length != normal_indices.length || position_indices.length != texture_coord_indices.length)
             throw 'Index count mismatch. Number of indices must be equal for all vertex data'
 
         let num_entries = position_indices.length
 
         let entry_indices = {}
 
         let out_vertex_positions = []
         let out_vertex_normals = []
         let out_vertex_texture_coords = []
 
         let out_indices = []
 
         for (let i = 0; i < num_entries; i++) {
             let position_idx = position_indices[i] * 3
             let normal_idx = normal_indices[i] * 3
             let texture_coord_idx = texture_coord_indices[i] * 2
 
             let key = `${[position_indices[i]]},${normal_indices[i]},${texture_coord_indices[i]}`
 
             if (!(key in entry_indices)) {
                 entry_indices[key] = out_vertex_positions.length / 3
                 for (let j = 0; j < 3; j++) {
                     out_vertex_positions.push(vertex_positions[position_idx + j])
                     out_vertex_normals.push(vertex_normals[normal_idx + j])
                     if (j < 2)
                        out_vertex_texture_coords.push(vertex_texture_coords[texture_coord_idx + j])
                 }
             }
 
             out_indices.push(entry_indices[key])
         }
 
 
         if (out_vertex_positions.length != out_vertex_normals.length)
             throw 'Both vertex data lists need to be the same length after processing'
 
         return [out_vertex_positions, out_vertex_normals, out_vertex_texture_coords, out_indices]
    }

    calculateTangents(vertex_positions, vertex_texture_coords, indices) {
        let vertex_tangents = []

        let get_triangle = (source, idx1, idx2, idx3, num_components) => {
            let triangle = []
            for (let idx of [idx1, idx2, idx3]) {
                let entry = []
                for (let k = 0; k < num_components; k++) {
                    entry.push(source[(idx*num_components)+k])
                }
                triangle.push(entry)
            }
            return triangle
        }

        for (let i = 0; i < indices.length; i+=3) {
            let [pos0,pos1,pos2] = get_triangle(vertex_positions, indices[i], indices[i+1], indices[i+2], 3)
            let [uv0, uv1, uv2] = get_triangle(vertex_texture_coords, indices[i], indices[i+1], indices[i+2], 2)

            let dpos1 = vec3.subtract(vec3.create(), pos1, pos0)
            let dpos2 = vec3.subtract(vec3.create(), pos2, pos0)

            let duv1 = vec2.subtract(vec2.create(), uv1, uv0)
            let duv2 = vec2.subtract(vec2.create(), uv2, uv0)

            let r = 1.0 / (duv1[0] * duv2[1] - duv1[1] * duv2[0]);
            let tangent = vec3.scale(vec3.create(), 
                vec3.subtract(vec3.create(),
                    vec3.scale(vec3.create(), dpos1, duv2[1]),
                    vec3.scale(vec3.create(), dpos2, duv1[1]))
                ,r)

            for (let j = 0; j < 3; j++) {
                vertex_tangents[indices[i+j]*3 ] = tangent[0]
                vertex_tangents[indices[i+j]*3 + 1] = tangent[1]
                vertex_tangents[indices[i+j]*3 + 2] = tangent[2]
            }
        }

        return vertex_tangents
    }
 
    parseVertex(vertex_string)
    {
        return this.parseVec3(vertex_string)
    }

    parseTextureCoord(texture_coord_string) {
        return this.parseVec2(texture_coord_string)
    }

    parseNormal(normal_string) {
        return this.parseVec3(normal_string)
    }

    parseVec3(vec_string) {
        let components = vec_string.split(' ')

        return [
            parseFloat(components[1]),
            parseFloat(components[2]),
            parseFloat(components[3])
        ]
    }

    parseVec2(vec_string) {
        let components = vec_string.split(' ')

        return [
            parseFloat(components[1]),
            parseFloat(components[2])
        ]
    }

    parseFace(face_string, entry_index)
    {
        let components = face_string.split(' ')
        let face = []

        for (let component of components) {
            if (component == 'f')
                continue

            let vtn = component.split('/')
            if (vtn.length <= entry_index)
                throw `No face entry found for entry indes ${entry_index}`
            face.push(parseInt(vtn[entry_index])-1)
        }

        if (face.length == 3) {
            return face
        } else if (face.length == 4) {
            return this.triangulateFace(face)
        } else {
            throw `Unexpected number of entries for face. Expected 3 or 4 but got ${face.length}`
        }
    }

    triangulateFace(face)
    {
        return [
            face[0], face[1], face[3],
            face[1], face[2], face[3]
        ]
    }
}

export
{
    OBJLoader
}