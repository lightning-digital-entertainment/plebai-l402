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
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishRelay = exports.publishRelays = exports.readRandomRow = exports.generateRandom10DigitNumber = exports.requestApiAccess = exports.sendHeaders = exports.vetifyLsatToken = exports.getLsatToChallenge = exports.relayIds = void 0;
const alby_tools_1 = require("alby-tools");
const l402js_1 = require("./l402js");
const Macaroon = __importStar(require("macaroon"));
const js_sha256_1 = require("js-sha256");
const fs = __importStar(require("fs"));
const nostr_tools_1 = require("nostr-tools");
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
            const pub = pubrelay.publish(event);
        }
        catch (e) {
            console.log('in catch with error: ', e);
        }
    });
}
exports.publishRelay = publishRelay;
//# sourceMappingURL=helpers.js.map