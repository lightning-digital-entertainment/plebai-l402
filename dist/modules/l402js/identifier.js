"use strict";
/* tslint:disable:max-classes-per-file */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeIdentifierFromMacaroon = exports.Identifier = exports.ErrUnknownVersion = exports.TOKEN_ID_SIZE = exports.LATEST_VERSION = void 0;
const assert_1 = __importDefault(require("assert"));
const bufio_1 = __importDefault(require("bufio"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const Macaroon = __importStar(require("macaroon"));
exports.LATEST_VERSION = 0;
exports.TOKEN_ID_SIZE = 32;
class ErrUnknownVersion extends Error {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(version, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrUnknownVersion);
        }
        this.name = 'ErrUnknownVersion';
        // Custom debugging information
        this.message = `${this.name}:${version}`;
    }
}
exports.ErrUnknownVersion = ErrUnknownVersion;
/**
 * @description An identifier encodes information about our LSAT that can be used as a unique identifier
 * and is used to generate a macaroon.
 * @extends Struct
 */
class Identifier extends bufio_1.default.Struct {
    /**
     *
     * @param {Object} options - options to create a new Identifier
     * @param {number} version - version of the identifier used to determine encoding of the raw bytes
     * @param {Buffer} paymentHash - paymentHash of the invoice associated with the LSAT.
     * @param {Buffer} tokenId - random 32-byte id used to identify the LSAT by
     */
    constructor(options) {
        super(options);
        this.version = exports.LATEST_VERSION;
        this.paymentHash = null;
        this.tokenId = null;
        if (options)
            this.fromOptions(options);
    }
    fromOptions(options) {
        if (options.version && options.version > exports.LATEST_VERSION)
            throw new ErrUnknownVersion(options.version);
        else if (options.version)
            this.version = options.version;
        (0, assert_1.default)(typeof this.version === 'number', 'Identifier version must be a number');
        (0, assert_1.default)(options.paymentHash.length === 32, `Expected 32-byte hash, instead got ${options.paymentHash.length}`);
        this.paymentHash = options.paymentHash;
        // TODO: generate random uuidv4 id (and hash to 32 to match length)
        if (!options.tokenId) {
            const id = (0, uuid_1.v4)();
            this.tokenId = crypto_1.default
                .createHash('sha256')
                .update(Buffer.from(id))
                .digest();
        }
        else {
            this.tokenId = options.tokenId;
        }
        (0, assert_1.default)(this.tokenId.length === exports.TOKEN_ID_SIZE, 'Token Id of unexpected size');
        return this;
    }
    /**
     * Convert identifier to string
     * @returns {string}
     */
    toString() {
        return this.toHex();
    }
    static fromString(str) {
        try {
            return new this().fromHex(str);
        }
        catch (e) {
            return new this().fromBase64(str);
        }
    }
    /**
     * Utility for encoding the Identifier into a buffer based on version
     * @param {bufio.BufferWriter} bw - Buffer writer for creating an Identifier Buffer
     * @returns {Identifier}
     */
    write(bw) {
        bw.writeU16BE(this.version);
        switch (this.version) {
            case 0:
                // write payment hash
                bw.writeHash(this.paymentHash);
                // check format of tokenId
                (0, assert_1.default)(Buffer.isBuffer(this.tokenId) &&
                    this.tokenId.length === exports.TOKEN_ID_SIZE, `Token ID must be ${exports.TOKEN_ID_SIZE}-byte hash`);
                // write tokenId
                bw.writeBytes(this.tokenId);
                return this;
            default:
                throw new ErrUnknownVersion(this.version);
        }
    }
    /**
     * Utility for reading raw Identifier bytes and converting to a new Identifier
     * @param {bufio.BufferReader} br - Buffer Reader to read bytes
     * @returns {Identifier}
     */
    read(br) {
        this.version = br.readU16BE();
        switch (this.version) {
            case 0:
                this.paymentHash = br.readHash();
                this.tokenId = br.readBytes(exports.TOKEN_ID_SIZE);
                return this;
            default:
                throw new ErrUnknownVersion(this.version);
        }
    }
}
exports.Identifier = Identifier;
const decodeIdentifierFromMacaroon = (raw) => {
    const macaroon = Macaroon.importMacaroon(raw);
    let identifier = macaroon._exportAsJSONObjectV2().i;
    if (identifier === undefined) {
        identifier = macaroon._exportAsJSONObjectV2().i64;
        if (identifier === undefined) {
            throw new Error(`Problem parsing macaroon identifier`);
        }
    }
    return identifier;
};
exports.decodeIdentifierFromMacaroon = decodeIdentifierFromMacaroon;
//# sourceMappingURL=identifier.js.map