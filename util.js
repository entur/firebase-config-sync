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
    return write(filePath, string + '\n')
}

function mapObject(obj, mapper) {
    if (!obj || typeof obj !== 'object') return obj
    return Object.entries(obj).reduce(
        (acc, [key, value]) => ({
            ...acc,
            [key]: mapper(value),
        }),
        {},
    )
}

exports.parseConfigValues = function parseConfigValues(config) {
    return mapObject(config, (serviceConfig) =>
        mapObject(serviceConfig, (value) => {
            try {
                return JSON.parse(value)
            } catch (error) {
                return value
            }
        }),
    )
}

function stringifyNonStrings(value) {
    return typeof value === 'string' ? value : JSON.stringify(value)
}

exports.transformJsonConfigToFirebaseArgs = function transformJsonConfigToFirebaseArgs(
    config,
) {
    return Object.keys(config)
        .map((service) =>
            Object.keys(config[service]).map(
                (varName) =>
                    `${service}.${varName}=${stringifyNonStrings(
                        config[service][varName],
                    )}`,
            ),
        )
        .reduce((a, b) => [...a, ...b])
}

exports.pickSameKeys = function pickSameKeys(
    someLargeObject,
    objectToResemble,
) {
    return Object.keys(someLargeObject).reduce((newObject, key) => {
        if (!Object.prototype.hasOwnProperty.call(objectToResemble, key)) {
            return newObject
        }
        if (typeof someLargeObject[key] === 'object') {
            return {
                ...newObject,
                [key]: pickSameKeys(
                    someLargeObject[key],
                    objectToResemble[key],
                ),
            }
        }
        return {
            ...newObject,
            [key]: someLargeObject[key],
        }
    }, {})
}

function isObject(object) {
    return !!object && typeof object === 'object' && !Array.isArray(object)
}

exports.sortObject = function sortObject(object) {
    if (!isObject(object)) return object
    return Object.keys(object)
        .sort()
        .reduce(
            (map, key) => ({
                ...map,
                [key]: sortObject(object[key]),
            }),
            {},
        )
}
