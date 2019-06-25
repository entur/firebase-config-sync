const { readFile } = require('fs')
const { promisify } = require('util')
const path = require('path')
const commander = require('commander');
const firebase = require('firebase-tools');

const read = promisify(readFile)

const program = new commander.Command();

async function readJsonFile(filePath) {
    const buffer = await read(filePath)
    return JSON.parse(buffer.toString())
}

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

function transformJsonConfigToFirebaseArgs(config) {
    return Object.keys(config)
        .map(service => Object.keys(config[service]).map(varName => `${service}.${varName}=${config[service][varName]}`))
        .reduce((a, b) => [...a, ...b])
}

async function set() {
    const configFiles = await getConfigFiles()
    const projects = Object.keys(configFiles)
    projects.forEach(async project => {
        const configFile = configFiles[project]

        console.log(`Uploading config to ${project} from ${configFile}`);

        const config = await readJsonFile(configFile)
        const parsed = transformJsonConfigToFirebaseArgs(config)
        await firebase.functions.config.set(parsed, { project })

        console.log(`Done uploading config to ${project} from ${configFile}`);
    })
}

program
    .option('-c, --config <path>', 'path to config file', '.firebaserc')
    .parse(process.argv);

set()
