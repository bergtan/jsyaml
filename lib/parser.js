const macros = require("./macros.js");
const fs = require('fs');
const yamlnode = require("./node.js")

function parseObjct(object) {
    let node = new yamlnode.Node()
    switch (typeof object) {
        case "object":
            if (object.concat("length")) {
                node.type = macros.Nodetype_Sequence
            }else{
                node.type = macros.Nodetype_Map
            }

            for(let item of object){
                node.childs.push(parseObjct(item))
            }
            break
        case "boolean":
        case "bigint":
        case "number":
        case "string":
        case "undefined":
            node.type = macros.Nodetype_Value
            node.value = object
            break
        default:
            log.error("get error object")
    }

    return node
}

function parse(context) {
    let node = new yamlnode.Node()
    node.parse(context)
    return node
}

function parseFile(file) {
    if (!fs.existsSync(file)) {
        return null
    }

    let tempData = fs.readFileSync(file, 'utf-8')
    if (tempData != "") {
        let node = parse(tempData)
        return node
    }

    return
}

module.exports = {
    parseObjct,
    parse,
    parseFile,
};