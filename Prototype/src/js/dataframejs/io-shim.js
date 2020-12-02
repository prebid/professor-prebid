import { __columns__ } from "./symbol.js";
import { FileNotFoundError } from "./errors.js";

const FILE_PATTERN = /^(?:[/]|[./]|(?:[a-zA-z]:[/])).*$/;

function saveFile(path, content) {
}

function loadTextFile(file, func) {
}

function addFileProtocol(path) {
}

function toDSV(df, sep = ";", header = true, path = undefined) {
}

function toText(df, sep = ";", header = true, path = undefined) {
}

function toCSV(df, header = true, path = undefined) {
}

function toTSV(df, header = true, path = undefined) {
}

function toPSV(df, header = true, path = undefined) {
}

function toJSON(df, asCollection = false, path = undefined) {
}

function fromDSV(pathOrFile, sep = ";", header = true) {
}

function fromText(pathOrFile, sep = ";", header = true) {
}

function fromCSV(pathOrFile, header = true) {
}

function fromTSV(pathOrFile, header = true) {
}

function fromPSV(pathOrFile, header = true) {
}

function fromJSON(pathOrFile) {
}

export {
    toDSV,
    toCSV,
    toTSV,
    toPSV,
    toText,
    toJSON,
    fromDSV,
    fromCSV,
    fromTSV,
    fromPSV,
    fromText,
    fromJSON
};
