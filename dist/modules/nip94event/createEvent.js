"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sizeOver1024 = exports.createNIP94Event = void 0;
const nostr_tools_1 = require("nostr-tools");
const crypto = __importStar(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const helpers_1 = require("../helpers");
const image_size_1 = __importDefault(require("image-size"));
function createNIP94Event(imageUrl, ptag, content) {
    return __awaiter(this, void 0, void 0, function* () {
        const tags = [];
        tags.push(['url', imageUrl]);
        const { size, type, width, height } = yield getFileAndImageDetailsFromUrl(imageUrl);
        const imageHash = yield computeSHA256ForURL(imageUrl);
        tags.push(['size', size.toString(10)]);
        tags.push(['dim', width + 'x' + height]);
        tags.push(['m', type]);
        tags.push(['x', imageHash]);
        if (ptag !== null)
            tags.push(['p', ptag]);
        const eventNip94 = {
            kind: 1063,
            pubkey: (0, nostr_tools_1.getPublicKey)(process.env.SK1),
            created_at: Math.floor(Date.now() / 1000),
            tags,
            content
        };
        eventNip94.id = (0, nostr_tools_1.getEventHash)(eventNip94);
        eventNip94.sig = (0, nostr_tools_1.getSignature)(eventNip94, process.env.SK1);
        console.log('1063 Event: ', eventNip94);
        (0, helpers_1.publishRelays)(eventNip94);
        return true;
    });
}
exports.createNIP94Event = createNIP94Event;
function getFileAndImageDetailsFromUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch headers using a HEAD request
            const headResponse = yield axios_1.default.head(url);
            // Extract headers
            const size = parseInt(headResponse.headers['content-length'] || '0', 10);
            const type = headResponse.headers['content-type'] || 'unknown';
            // Get image data
            const response = yield axios_1.default.get(url, { responseType: 'arraybuffer' });
            // Use the image-size library to get dimensions
            const dimensions = (0, image_size_1.default)(Buffer.from(response.data));
            return {
                size,
                type,
                width: dimensions.width,
                height: dimensions.height
            };
        }
        catch (error) {
            console.error('An error occurred:', error);
            throw error;
        }
    });
}
function sizeOver1024(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (url === null)
                return false;
            const response = yield axios_1.default.get(url, { responseType: 'arraybuffer' });
            const dimensions = (0, image_size_1.default)(Buffer.from(response.data));
            if (dimensions.width > 1025)
                return true;
            if (dimensions.height > 1025)
                return true;
        }
        catch (error) {
            console.log(error);
        }
        return false;
    });
}
exports.sizeOver1024 = sizeOver1024;
function computeSHA256ForURL(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const hash = crypto.createHash('sha256');
            try {
                const response = yield axios_1.default.get(url, {
                    responseType: 'stream'
                });
                response.data.on('data', (chunk) => {
                    hash.update(chunk);
                });
                response.data.on('end', () => {
                    resolve(hash.digest('hex'));
                });
                response.data.on('error', (error) => {
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        }));
    });
}
//# sourceMappingURL=createEvent.js.map