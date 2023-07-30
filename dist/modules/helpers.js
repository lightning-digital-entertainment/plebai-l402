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
exports.generateRandom10DigitNumber = exports.requestApiAccess = exports.sendHeaders = exports.vetifyLsatToken = exports.getLsatToChallenge = void 0;
const alby_tools_1 = require("alby-tools");
const l402js_1 = require("./l402js");
const Macaroon = __importStar(require("macaroon"));
const js_sha256_1 = require("js-sha256");
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
//# sourceMappingURL=helpers.js.map