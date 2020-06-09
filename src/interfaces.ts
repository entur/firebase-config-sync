export interface ConfigFileRemote {
    [service: string]: {
        [varName: string]: string
    }
}

export interface ConfigFileLocal {
    [service: string]: {
        [varName: string]: unknown
    }
}
