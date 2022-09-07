#!/usr/bin/env node
import path from 'path'
import commander from 'commander'
import firebase from 'firebase-tools'

import {
    readJsonFile,
    writeJsonFile,
    transformJsonConfigToFirebaseArgs,
    pickSameKeys,
    sortObject,
    parseConfigValues,
    pickMissingKeyPaths,
} from './util'

import { ConfigFileLocal, ConfigFileRemote } from './interfaces'

const program = new commander.Command()

function logInfo(text: string, ...rest: any[]): void {
    if (!program.quiet) console.log(text, ...rest)
}

function logError(text: string): void {
    if (!program.quiet) console.error(text)
}

async function getConfigFiles(): Promise<{ [project: string]: string }> {
    const { config } = program
    const filePath = path.resolve(config)

    try {
        const configData = await readJsonFile<{
            configFiles: { [project: string]: string }
        }>(filePath)
        return configData.configFiles
    } catch (error) {
        logError(
            'No config found. Please add "configFiles" to your .firebaserc',
        )
        return {}
    }
}

async function getProjects(configFiles: { [key: string]: unknown }) {
    const argProjects = program.project && program.project.trim().split(',')
    return Object.keys(configFiles).filter(
        (p) => !argProjects || argProjects.includes(p),
    )
}

// Removes all config in firebase that is not found in .env files.
async function purge() {
    const configFiles = await getConfigFiles()
    const projects = await getProjects(configFiles)

    for (const project of projects) {
        const configFile = program.file
            ? program.file.replace('{project}', project)
            : configFiles[project]

        logInfo(`Downloading config to ${configFile} from ${project}`)

        const deployedConfig: ConfigFileRemote =
            await firebase.functions.config.get(undefined, { project })

        const localConfig = await readJsonFile<ConfigFileLocal>(configFile)
        const pathsOnlyInDeployed = pickMissingKeyPaths(
            '',
            deployedConfig,
            localConfig,
        )

        if (pathsOnlyInDeployed.length > 0) {
            logInfo(
                `Removing ${pathsOnlyInDeployed.length} entries from ${project}`,
                pathsOnlyInDeployed,
            )

            await firebase.functions.config.unset(pathsOnlyInDeployed, {
                project,
            })

            logInfo(
                `Done purging config, removed entries not found in .env file from ${project}`,
            )
        } else {
            logInfo(`No config entries to remove from ${project}`)
        }
    }
}

async function get() {
    const configFiles = await getConfigFiles()
    const projects = await getProjects(configFiles)

    for (const project of projects) {
        const configFile = program.file
            ? program.file.replace('{project}', project)
            : configFiles[project]

        logInfo(`Downloading config to ${configFile} from ${project}`)

        let config: ConfigFileRemote = await firebase.functions.config.get(
            undefined,
            { project },
        ).catch(error){
                console.error(error);
        return {}
        }

        if (program.ignore) {
            const existingConfig = await readJsonFile<ConfigFileLocal>(
                configFile,
            )
            config = pickSameKeys(config, existingConfig)
        }

        if (program.sort) {
            config = sortObject(config)
        }

        const localConfig: ConfigFileLocal = program.parsing
            ? parseConfigValues(config)
            : config

        await writeJsonFile(configFile, localConfig)

        logInfo(`Done downloading config to ${configFile} from ${project}`)
    }
}

async function set() {
    let configFiles: { [project: string]: string }

    if (program.file) {
        if (!program.project) {
            logError(
                'File option can only be used together with project option',
            )
            return
        }

        configFiles = {
            [program.project]: program.file,
        }
    } else {
        configFiles = await getConfigFiles()
    }

    const projects = await getProjects(configFiles)

    for (const project of projects) {
        const configFile = configFiles[project]

        logInfo(`Uploading config to ${project} from ${configFile}`)

        const config = await readJsonFile<ConfigFileLocal>(configFile)
        const parsed = transformJsonConfigToFirebaseArgs(config)
        await firebase.functions.config.set(parsed, { project })

        logInfo(`Done uploading config to ${project} from ${configFile}`)
    }
}

let command

program
    .arguments('<cmd>')
    .option('-c, --config <path>', 'path to config file', '.firebaserc')
    .option(
        '-P, --project <names>',
        'comma-separated list of project names to deploy to',
    )
    .option('-q, --quiet', 'disable all logging to console')
    .option(
        '-i, --ignore',
        'get: do not save config that is not already in env file',
    )
    .option(
        '-s, --sort',
        'get: sort config alphabetically before saving to config file',
    )
    .option(
        '-f, --file <path>',
        "get: custom file to save to, if you don't want to use the one specified in configFiles",
    )
    .option(
        '-f, --file <path>',
        'set: custom file to upload. Must be used together with --project with a single argument.',
    )
    .option(
        '-n, --no-parsing',
        'get: do not parse config values before saving to file',
    )
    .action((cmd) => {
        command = cmd
    })
    .parse(process.argv)

if (command === 'get') {
    get()
} else if (command === 'set') {
    set()
} else if (command === 'purge') {
    purge()
} else if (!command) {
    console.error(
        `No command given. Please pass command "get", "set" or "purge".`,
    )
} else {
    console.error(
        `Unrecognized command "${command}". Use "get", "set" or "purge".`,
    )
}
