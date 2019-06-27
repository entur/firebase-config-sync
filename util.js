const { readFile, writeFile } = require('fs')
const { promisify } = require('util')

const read = promisify(readFile)
const write = promisify(writeFile)

exports.readJsonFile = async function readJsonFile(filePath) {
    const buffer = await read(filePath)
    return JSON.parse(buffer.toString())
}

exports.writeJsonFile = function writeJsonFile(filePath, jsonData) {
    const string = JSON.stringify(jsonData, undefined, 2)
    return write(filePath, string)
}

exports.transformJsonConfigToFirebaseArgs = function transformJsonConfigToFirebaseArgs(config) {
    return Object.keys(config)
        .map(service => Object.keys(config[service]).map(varName => `${service}.${varName}=${config[service][varName]}`))
        .reduce((a, b) => [...a, ...b])
}
