'use strict'

import { loadExternalFile, getFileDir } from './js/utils/utils.js'
import Material from './js/app/material.js'
import Texture from './texture.js'

class MTLLoader {
    constructor(filename) {
        this.filename = filename
    }

    load( gl ) {
        let contents = loadExternalFile(this.filename)
        let materials = {}
        let current_material = ''
        let filepath = getFileDir(this.filename)

        for (let line of contents.split('\n')){
            let token = line.split(' ')[0]
            switch(token) {
                case 'newmtl':
                    current_material = line.split(' ')[1]
                    materials[current_material] = new Material()
                    break
                case 'Ka':
                    materials[current_material].kA = this.parseVec3(line)
                    break
                case 'Kd':
                    materials[current_material].kD = this.parseVec3(line)
                    break
                case 'Ks':
                    materials[current_material].kS = this.parseVec3(line)
                    break
                case 'Ns':
                    materials[current_material].shininess = parseFloat(line.split(' ')[1])
                    break
                case 'map_Kd':
                    let file_map_kd = line.split(' ')[1]
                    materials[current_material].map_kD = new Texture(`${filepath}/${file_map_kd}`, gl)
                    break
                case 'map_Ns':
                    let file_map_ks = line.split(' ')[1]
                    materials[current_material].map_nS = new Texture(`${filepath}/${file_map_ks}`, gl)
                    break
                case 'map_Bump':
                case 'bump':
                case 'norm':
                    let line_split = line.split(' ')
                    let file_map_norm = line_split[line_split.length-1]
                    materials[current_material].map_norm = new Texture(`${filepath}/${file_map_norm}`, gl)
                    break
            }
        }
        return materials
    }

    parseVec3(vec_string) {
        let components = vec_string.split(' ')

        return [
            parseFloat(components[1]),
            parseFloat(components[2]),
            parseFloat(components[3])
        ]
    }
}

export
{
    MTLLoader
}