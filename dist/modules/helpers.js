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
exports.writeToFile = exports.readFromFile = exports.getCurrentUrl = exports.getGifUrl = exports.errorServer = exports.errorAdultcontent = exports.errorUnauthorized = exports.errorBadArguments = exports.errorInvoicePaid = exports.extractUrl = exports.extractUrls = exports.splitStringByUrl = exports.errorBadAuth = exports.removeKeyword = exports.getResults = exports.saveBase64AsImageFile = exports.getBase64ImageFromURL = exports.closestMultipleOf256 = exports.findBestMatch = exports.getImageUrlFromFile = exports.deleteImageUrl = exports.getImageUrl = exports.publishRelay = exports.publishRelays = exports.readRandomRow = exports.generateRandom5DigitNumber = exports.generateRandom9DigitNumber = exports.generateRandom10DigitNumber = exports.requestApiAccess = exports.sendHeaders = exports.vetifyLsatToken = exports.getLsatToChallenge = exports.encrypt = exports.ModelIds = exports.relayIds = void 0;
const alby_tools_1 = require("alby-tools");
const l402js_1 = require("./l402js");
const Macaroon = __importStar(require("macaroon"));
const js_sha256_1 = require("js-sha256");
const fs = __importStar(require("fs"));
const nostr_tools_1 = require("nostr-tools");
const fs_1 = require("fs");
const form_data_1 = __importDefault(require("form-data"));
const axios_1 = __importDefault(require("axios"));
const sharp_1 = __importDefault(require("sharp"));
const url = __importStar(require("url"));
const child_process_1 = require("child_process");
const crypto = __importStar(require("crypto"));
exports.relayIds = [
    'wss://relay.current.fyi',
    'wss://nostr1.current.fyi',
    'wss://nostr-pub.wellorder.net',
    'wss://relay.damus.io',
    'wss://nostr-relay.wlvs.space',
    'wss://nostr.zebedee.cloud',
    'wss://student.chadpolytechnic.com',
    'wss://global.relay.red',
    'wss://nos.lol',
    'wss://relay.primal.net',
    'wss://nostr21.com',
    'wss://offchain.pub',
    'wss://relay.plebstr.com',
    'wss://nostr.mom',
    'wss://relay.nostr.bg',
    'wss://nostr.oxtr.dev',
    'wss://relay.nostr.bg',
    'wss://no.str.cr',
    'wss://nostr-relay.nokotaro.com',
    'wss://relay.nostr.wirednet.jp'
];
exports.ModelIds = [
    "stable-diffusion-xl-v1-0",
    "dark-sushi-mix-v2-25",
    "absolute-reality-v1-6",
    "synthwave-punk-v2",
    "arcane-diffusion",
    "moonfilm-reality-v3",
    "moonfilm-utopia-v3",
    "moonfilm-film-grain-v1",
    "openjourney-v4",
    "realistic-vision-v3",
    "icbinp-final",
    "icbinp-relapse",
    "icbinp-afterburn",
    "xsarchitectural-interior-design",
    "mo-di-diffusion",
    "anashel-rpg",
    "realistic-vision-v1-3-inpainting",
    "eimis-anime-diffusion-v1-0",
    "something-v2-2",
    "icbinp",
    "analog-diffusion",
    "neverending-dream",
    "van-gogh-diffusion",
    "openjourney-v1-0",
    "realistic-vision-v1-3",
    "stable-diffusion-v1-5-inpainting",
    "gfpgan-v1-3",
    "real-esrgan-4x",
    "instruct-pix2pix",
    "stable-diffusion-v2-1",
    "stable-diffusion-v1-5"
];
function encrypt(text, key) {
    const algorithm = 'aes-256-ctr';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
        key
    };
}
exports.encrypt = encrypt;
function getLsatToChallenge(requestBody, amtinsats) {
    return __awaiter(this, void 0, void 0, function* () {
        const ln = new alby_tools_1.LightningAddress(process.env.LIGHTNING_ADDRESS);
        yield ln.fetch();
        const invoice = yield ln.requestInvoice({ satoshi: amtinsats });
        const identifier = new l402js_1.Identifier({
            paymentHash: Buffer.from(invoice.paymentHash, 'hex'),
        });
        const macaroon = Macaroon.newMacaroon({
            version: 1,
            rootKey: process.env.SIGNING_KEY,
            identifier: identifier.toString(),
            location: process.env.MAC_LOCATION,
        });
        const lsat = l402js_1.Lsat.fromMacaroon((0, l402js_1.getRawMacaroon)(macaroon), invoice.paymentRequest);
        const caveat = l402js_1.Caveat.decode('bodyHash=' + js_sha256_1.sha256.update((JSON.stringify(requestBody))));
        const caveatExpiry = new l402js_1.Caveat({
            condition: 'expiration',
            // adding 15 mins expiry
            value: Date.now() + 900000
        });
        lsat.addFirstPartyCaveat(caveat);
        lsat.addFirstPartyCaveat(caveatExpiry);
        console.log(lsat.toJSON());
        console.log('Caveats: ', lsat.getCaveats());
        return lsat;
    });
}
exports.getLsatToChallenge = getLsatToChallenge;
function vetifyLsatToken(lsatToken, requestBody) {
    try {
        const bodyhash = '' + js_sha256_1.sha256.update((JSON.stringify(requestBody)));
        const lsat = l402js_1.Lsat.fromToken(lsatToken);
        // Check to see if expires or preimage/hash not satisfied
        if (lsat.isExpired() || !lsat.isSatisfied)
            return false;
        const result = (0, l402js_1.verifyMacaroonCaveats)(lsat.baseMacaroon, process.env.SIGNING_KEY, l402js_1.expirationSatisfier);
        // check if macaroon is not tampered
        if (!result)
            return false;
        const caveats = lsat.getCaveats();
        // check if the body hash matches
        for (const caveat of caveats) {
            if (caveat.condition === 'bodyHash' && caveat.value !== bodyhash) {
                console.log('inside bodyhash', caveat.value);
                return false;
            }
        }
    }
    catch (error) {
        console.log('Inside catch with error: ', error);
        return false;
    }
    return true;
}
exports.vetifyLsatToken = vetifyLsatToken;
function sendHeaders(stream) {
    if (stream) {
        return {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Connection': 'keep-alive',
            'server': 'uvicorn',
            'Cache-Control': 'no-cache',
            'Transfer-Encoding': 'chunked'
        };
    }
    else {
        return {
            'Content-Type': 'application/json',
            'server': 'uvicorn',
        };
    }
}
exports.sendHeaders = sendHeaders;
function requestApiAccess(apiPath) {
    // API key
    // API host
    const host = (process.env.CURRENT_API_HOST || '').trim();
    return {
        headers: {
            'Content-Type': 'application/json',
        },
        url: host + apiPath,
    };
}
exports.requestApiAccess = requestApiAccess;
function generateRandom10DigitNumber() {
    const min = 1000000000; // 10-digit number starting with 1
    const max = 9999999999; // 10-digit number ending with 9
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}
exports.generateRandom10DigitNumber = generateRandom10DigitNumber;
function generateRandom9DigitNumber() {
    const min = 100000000; // 9-digit number starting with 1
    const max = 999999999; // 9-digit number ending with 9
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}
exports.generateRandom9DigitNumber = generateRandom9DigitNumber;
function generateRandom5DigitNumber() {
    const min = 1000; // 4-digit number starting with
    const max = 10000; // 5-digit number ending with
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}
exports.generateRandom5DigitNumber = generateRandom5DigitNumber;
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function readRandomRow(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        if (lines.length === 0) {
            return null;
        }
        const numberOfLines = content.split('\n');
        const randomIndex = getRandomInt(1, numberOfLines.length);
        return lines[randomIndex];
    }
    catch (err) {
        console.error('Error reading the file:', err);
        return null;
    }
}
exports.readRandomRow = readRandomRow;
function publishRelays(event) {
    exports.relayIds.forEach(function (item) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('publishing on', item);
            try {
                yield publishRelay(item, event);
            }
            catch (error) {
                console.log('in catch with error: ', error);
            }
        });
    });
}
exports.publishRelays = publishRelays;
function publishRelay(relayUrl, event) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pubrelay = (0, nostr_tools_1.relayInit)(relayUrl);
            yield pubrelay.connect();
            yield pubrelay.publish(event);
        }
        catch (e) {
            console.log('in catch with error: ', e);
        }
    });
}
exports.publishRelay = publishRelay;
function getImageUrl(id, outputFormat) {
    return __awaiter(this, void 0, void 0, function* () {
        const form = new form_data_1.default();
        form.append('asset', (0, fs_1.createReadStream)(process.env.UPLOAD_PATH + id + `.` + outputFormat));
        form.append("name", 'current/plebai/genimg/' + id + `.` + outputFormat);
        form.append("type", "image");
        const config = {
            method: 'post',
            url: process.env.UPLOAD_URL,
            headers: Object.assign({ 'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH, 'Content-Type': 'multipart/form-data' }, form.getHeaders()),
            data: form
        };
        const resp = yield axios_1.default.request(config);
        (0, fs_1.unlink)(process.env.UPLOAD_PATH + id + `.` + outputFormat, (err) => {
            if (err) {
                console.log(err);
            }
            console.log('tmp file deleted');
        });
        return resp.data.data;
    });
}
exports.getImageUrl = getImageUrl;
function deleteImageUrl(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = JSON.stringify({ name });
        const config = {
            method: 'post',
            url: process.env.DELETE_URL,
            headers: {
                'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH,
                'Content-Type': 'application/json',
            },
            data
        };
        axios_1.default.request(config);
        // console.log(resp);
    });
}
exports.deleteImageUrl = deleteImageUrl;
function getImageUrlFromFile(dir, file) {
    return __awaiter(this, void 0, void 0, function* () {
        const form = new form_data_1.default();
        form.append('asset', (0, fs_1.createReadStream)(dir + file));
        form.append("name", 'current/plebai/genimg/' + file);
        form.append("type", "image");
        const config = {
            method: 'post',
            url: process.env.UPLOAD_URL,
            headers: Object.assign({ 'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH, 'Content-Type': 'multipart/form-data' }, form.getHeaders()),
            data: form
        };
        const resp = yield axios_1.default.request(config);
        (0, fs_1.unlink)(dir + file, (err) => {
            if (err) {
                console.log(err);
            }
            console.log('tmp file deleted');
        });
        return resp.data.data;
    });
}
exports.getImageUrlFromFile = getImageUrlFromFile;
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
// Function to find the string with the strongest match
function findBestMatch(target, list) {
    let minDistance = Infinity;
    let bestMatch = "";
    for (const str of list) {
        const distance = levenshtein(target, str);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = str;
        }
    }
    return bestMatch;
}
exports.findBestMatch = findBestMatch;
function closestMultipleOf256(num) {
    // Round to the nearest integer in case of floating point numbers.
    num = Math.round(num);
    const remainder = num % 256;
    if (remainder === 0) {
        return num; // The number is already a multiple of 256.
    }
    if (remainder <= 128) {
        return num - remainder; // Round down (or up for negative numbers)
    }
    else {
        return num + (256 - remainder); // Round up (or down for negative numbers)
    }
}
exports.closestMultipleOf256 = closestMultipleOf256;
function getBase64ImageFromURL(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (url === null)
                return null;
            const response = yield axios_1.default.get(url, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(response.data);
            console.log('image buffer');
            const image = (0, sharp_1.default)(imageBuffer);
            const metadata = yield image.metadata();
            if (metadata.width > 1024 || metadata.height > 1024) {
                console.log('inside iamge resize');
                image.resize({
                    width: 1024,
                    height: 1024,
                    fit: sharp_1.default.fit.inside,
                    withoutEnlargement: true
                });
                const buffer = yield image.toBuffer();
                return buffer.toString('base64');
            }
            return Buffer.from(response.data).toString('base64');
        }
        catch (error) {
            console.log('Error at getBase64ImageFromURL', error);
            return null;
        }
    });
}
exports.getBase64ImageFromURL = getBase64ImageFromURL;
function saveBase64AsImageFile(filename, base64String) {
    // Convert base64 string to a buffer
    const buffer = Buffer.from(base64String, 'base64');
    // Write buffer to a file
    fs.writeFileSync(process.env.UPLOAD_PATH + filename, buffer);
}
exports.saveBase64AsImageFile = saveBase64AsImageFile;
function getResults(results) {
    let data = '';
    for (const result of results) {
        data = data + " " + result.content;
    }
    return data;
}
exports.getResults = getResults;
function removeKeyword(inputString) {
    const keywords = ['/photo', '/midjourney'];
    const keyword = keywords.find(keyword => inputString.includes(keyword));
    const modifiedString = inputString.replace(keyword, '');
    return { keyword, modifiedString };
}
exports.removeKeyword = removeKeyword;
function errorBadAuth(res) {
    return res.status(400).send({
        error: true,
        code: 1,
        message: 'bad auth',
    });
}
exports.errorBadAuth = errorBadAuth;
function splitStringByUrl(inputString) {
    try {
        const urlObject = url.parse(inputString);
        const urlIndex = inputString.indexOf(urlObject.href);
        return [
            inputString.slice(0, urlIndex).trim(),
            urlObject.href
        ];
    }
    catch (error) {
        console.log(error);
        return null;
    }
}
exports.splitStringByUrl = splitStringByUrl;
function extractUrls(text) {
    const urlRegex = /(\b(https):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const matches = text.match(urlRegex);
    if (!matches) {
        return '';
    }
    return matches.map(url => JSON.stringify({
        type: "image_url",
        image_url: {
            "url": url
        }
    })).join(',\n');
}
exports.extractUrls = extractUrls;
function extractUrl(text) {
    const urlRegex = /(\b(https):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const matches = text.match(urlRegex);
    if (!matches) {
        return '';
    }
    return matches[0];
}
exports.extractUrl = extractUrl;
function errorDailyLimit(res) {
    return res.status(400).send({
        error: true,
        code: 1,
        message: 'Exceeded daily limit of 50,000 sats',
    });
}
function errorInvoicePaid(res) {
    return res.status(500).send({
        error: true,
        code: 1,
        message: 'Invoice already paid...',
    });
}
exports.errorInvoicePaid = errorInvoicePaid;
function errorBadArguments(res) {
    return res.status(500).send({
        error: true,
        code: 2,
        message: 'bad arguments',
    });
}
exports.errorBadArguments = errorBadArguments;
function errorUnauthorized(res) {
    return res.status(401).send({
        error: true,
        code: 2,
        message: 'Auth failed',
    });
}
exports.errorUnauthorized = errorUnauthorized;
function errorAdultcontent(res) {
    return res.status(500).send({
        error: true,
        code: 2,
        message: 'Adult content detected..!',
    });
}
exports.errorAdultcontent = errorAdultcontent;
function errorServer(res) {
    return res.status(500).send({
        error: true,
        code: 3,
        message: 'internal Server error',
    });
}
exports.errorServer = errorServer;
function getGifUrl(url, filePath, id, type) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileName = id + '.mp4';
        const localFile = process.env.UPLOAD_PATH ? process.env.UPLOAD_PATH + fileName : '';
        if (url !== '')
            yield (downloadFile(url, localFile));
        fileName = id + '.gif';
        let cmd = 'ffmpeg -i input -q:a 0 output';
        cmd = cmd.replace(new RegExp('input', 'g'), localFile).replace('output', process.env.UPLOAD_PATH + fileName);
        console.log(cmd);
        yield executeCommand(cmd); // Replace 'ls' with your command
        console.log('s3 name: ', filePath + fileName);
        const form = new form_data_1.default();
        form.append('asset', (0, fs_1.createReadStream)(process.env.UPLOAD_PATH + fileName));
        form.append("name", filePath + fileName);
        form.append("type", type);
        const config = {
            method: 'post',
            url: process.env.UPLOAD_URL,
            headers: Object.assign({ 'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH, 'Content-Type': 'multipart/form-data' }, form.getHeaders()),
            data: form
        };
        const resp = yield axios_1.default.request(config);
        console.log('Current file: ', resp.data.data);
        (0, fs_1.unlink)(localFile, (err) => {
            if (err) {
                console.log(err);
            }
            console.log('tmp file deleted');
        });
        (0, fs_1.unlink)(process.env.UPLOAD_PATH + fileName, (err) => {
            if (err) {
                console.log(err);
            }
            console.log('tmp file deleted');
        });
        return resp.data.data;
    });
}
exports.getGifUrl = getGifUrl;
function getCurrentUrl(url, filePath, id, type) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileName = id + '.' + type;
        const localFile = process.env.UPLOAD_PATH ? process.env.UPLOAD_PATH + fileName : '';
        if (url !== '')
            yield (downloadFile(url, localFile));
        console.log('s3 name: ', filePath + fileName);
        const form = new form_data_1.default();
        form.append('asset', (0, fs_1.createReadStream)(localFile));
        form.append("name", filePath + fileName);
        form.append("type", type);
        const config = {
            method: 'post',
            url: process.env.UPLOAD_URL,
            headers: Object.assign({ 'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH, 'Content-Type': 'multipart/form-data' }, form.getHeaders()),
            data: form
        };
        const resp = yield axios_1.default.request(config);
        console.log('Current file: ', resp.data.data);
        (0, fs_1.unlink)(localFile, (err) => {
            if (err) {
                console.log(err);
            }
            console.log('tmp file deleted');
        });
        return resp.data.data;
    });
}
exports.getCurrentUrl = getCurrentUrl;
function downloadFile(url, localFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, axios_1.default)({
            method: 'GET',
            url,
            responseType: 'stream'
        });
        return new Promise((resolve, reject) => {
            const writer = (0, fs_1.createWriteStream)(localFile);
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    console.log(localFile);
                    resolve();
                }
            });
        });
    });
}
function readFromFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            (0, fs_1.readFile)(filename, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    });
}
exports.readFromFile = readFromFile;
// Function to write text to a file
function writeToFile(filename, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            (0, fs_1.writeFile)(filename, data, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
exports.writeToFile = writeToFile;
function executeCommand(command) {
    try {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(command, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error: ${error.message}`);
                    return;
                }
                resolve(stdout);
            });
        });
    }
    catch (error) {
        console.log('Error in cmd: ', error);
        return null;
    }
}
//# sourceMappingURL=helpers.js.map