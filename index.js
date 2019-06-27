#!/usr/bin/env node
const path = require('path')
const commander = require('commander');
const firebase = require('firebase-tools');

const {
    readJsonFile,
    writeJsonFile,
    transformJsonConfigToFirebaseArgs
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

        const conf = await firebase.functions.config.get(undefined, { project })
        await writeJsonFile(configFile, conf)

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
