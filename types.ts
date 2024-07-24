export enum Status {
    PROCESSING,
    SUCCESS,
    FAILED
}

export interface Packet {
    id: number,
    status: Status,
    songName: string,
    statusCode: number,
    errorMessage: string,
    accuracy: number
}

export interface Seperator {
    id: number,
    type: number
}
export interface Initialization {
    id: number,
    lineType: number,
    message: string,
    messageOptional: string,
    result: boolean
}

export interface NetworkDetails {
    ifConnected: boolean,
    latency: number,
    speed: number
}

export interface ServerHealth {
    status: number,
    message: string
}