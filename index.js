#!/usr/bin/env node
const path = require('path')
const commander = require('commander');
const firebase = require('firebase-tools');

const {
    readJsonFile,
    writeJsonFile,
    transformJsonConfigToFirebaseArgs,
    pickSameKeys,
} = require('./util')

const program = new commander.Command();

async function getConfigFiles() {
    const { config } = program
    const filePath = path.resolve(config)

    try {
        const configData = await readJsonFile(filePath)
        return configData.configFiles
    } catch (error) {
        console.error('No config found. Please add "configFiles" to your .firebaserc')
    }
}

async function getProjects(configFiles) {
    const argProjects = program.project && program.project.trim().split(',')
    return Object.keys(configFiles).filter(p => !argProjects || argProjects.includes(p))
}

async function get() {
    const configFiles = await getConfigFiles()
    const projects = await getProjects(configFiles)

    projects.forEach(async project => {
        const configFile = configFiles[project]

        console.log(`Downloading config to ${configFile} from ${project}`);

        const remoteConfig = await firebase.functions.config.get(undefined, { project })

        if (program.ignore) {
            const existingConfig = await readJsonFile(configFile)
            await writeJsonFile(configFile, pickSameKeys(remoteConfig, existingConfig))
        } else {
            await writeJsonFile(configFile, remoteConfig)
        }

        console.log(`Done downloading config to ${configFile} from ${project}`);
    })
}

async function set() {
    const configFiles = await getConfigFiles()
    const projects = await getProjects(configFiles)

    projects.forEach(async project => {
        const configFile = configFiles[project]

        console.log(`Uploading config to ${project} from ${configFile}`);

        const config = await readJsonFile(configFile)
        const parsed = transformJsonConfigToFirebaseArgs(config)
        await firebase.functions.config.set(parsed, { project })

        console.log(`Done uploading config to ${project} from ${configFile}`);
    })
}

let command

program
    .arguments('<cmd>')
    .option('-c, --config <path>', 'path to config file', '.firebaserc')
    .option('-P, --project <names>', 'comma-separated list of project names to deploy to')
    .option('-i, --ignore', 'get: do not save config that is not already in env file')
    .action(cmd => { command = cmd })
    .parse(process.argv);

if (command === 'get') {
    get()
} else if (command === 'set') {
    set()
} else if (!command) {
    console.error(`No command given. Please pass command "get" or "set".`)
} else {
    console.error(`Unrecognized command "${command}". Use "get" or "set".`)
}
