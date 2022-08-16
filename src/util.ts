import { readFile, writeFile } from 'fs'
import { promisify } from 'util'

import { ConfigFileLocal, ConfigFileRemote } from './interfaces'

const read = promisify(readFile)
const write = promisify(writeFile)

export async function readJsonFile<T>(filePath: string): Promise<T> {
    const buffer = await read(filePath)
    return JSON.parse(buffer.toString())
}

export function writeJsonFile(
    filePath: string,
    jsonData: { [key: string]: unknown },
): Promise<void> {
    const string = JSON.stringify(jsonData, undefined, 2)
    return write(filePath, string + '\n')
}

function mapObject<T, V>(
    obj: { [key: string]: T },
    mapper: (val: T) => V,
): { [key: string]: V } {
    if (!obj || typeof obj !== 'object') return obj
    return Object.entries(obj).reduce(
        (acc, [key, value]) => ({
            ...acc,
            [key]: mapper(value),
        }),
        {},
    )
}

export function parseConfigValues(config: ConfigFileRemote): ConfigFileLocal {
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

function stringifyNonStrings(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value)
}

export function transformJsonConfigToFirebaseArgs(
    config: ConfigFileLocal,
): string[] {
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

export function pickSameKeys(
    someLargeObject: { [key: string]: any },
    objectToResemble: { [key: string]: any },
): { [key: string]: any } {
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

export function pickMissingKeys(
    root: string,
    deployedObject: { [key: string]: any },
    localObject: { [key: string]: any },
): { [key: string]: any } {
    return Object.keys(deployedObject).reduce((newObject, key) => {
        if (!Object.prototype.hasOwnProperty.call(localObject, key)) {
            // whole sub object can be removed
            console.log(`${root}.${key}`)
            return {
                ...newObject,
                [key]: deployedObject[key],
            }
        } else {
            // object exists but we need to see if any sub keys should be removed
            if (typeof deployedObject[key] === 'object') {
                const missingChildKeys = pickMissingKeys(
                    `${root}.${key}`,
                    deployedObject[key],
                    localObject[key],
                )

                if (Object.keys(missingChildKeys).length > 0) {
                    return {
                        ...newObject,
                        [key]: missingChildKeys,
                    }
                }
            }
        }

        return newObject
    }, {})
}

export function pickMissingKeyPaths(
    root: string,
    deployedObject: { [key: string]: any },
    localObject: { [key: string]: any },
): string[] {
    return Object.keys(deployedObject).reduce((paths: string[], key) => {
        const path = `${root}${root !== '' ? '.' : ''}${key}`
        if (!Object.prototype.hasOwnProperty.call(localObject, key)) {
            // whole sub object can be removed
            return [...paths, path]
        } else {
            // object exists but we need to see if any sub keys should be removed
            if (typeof deployedObject[key] === 'object') {
                const missingChildKeys = pickMissingKeyPaths(
                    path,
                    deployedObject[key],
                    localObject[key],
                )

                if (Object.keys(missingChildKeys).length > 0) {
                    return [...paths, ...missingChildKeys]
                }
            }
        }

        return paths
    }, [])
}

function isObject(obj: { [key: string]: any }): boolean {
    return !!obj && typeof obj === 'object' && !Array.isArray(obj)
}

export function sortObject(object: { [key: string]: any }): {
    [key: string]: any
} {
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
