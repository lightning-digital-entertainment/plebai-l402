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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRawMacaroon = exports.verifyMacaroonCaveats = exports.getCaveatsFromMacaroon = void 0;
const caveat_1 = require("./caveat");
const helpers_1 = require("./helpers");
const Macaroon = __importStar(require("macaroon"));
const base64_1 = require("@stablelib/base64");
/**
 * @description utility function to get an array of caveat instances from
 * a raw macaroon.
 * @param {string} macaroon - raw macaroon to retrieve caveats from
 * @returns {Caveat[]} array of caveats on the macaroon
 */
function getCaveatsFromMacaroon(rawMac) {
    var _a;
    const macaroon = Macaroon.importMacaroon(rawMac);
    const caveats = [];
    const rawCaveats = (_a = macaroon._exportAsJSONObjectV2()) === null || _a === void 0 ? void 0 : _a.c;
    if (rawCaveats) {
        for (const c of rawCaveats) {
            if (!c.i)
                continue;
            const caveat = caveat_1.Caveat.decode(c.i);
            caveats.push(caveat);
        }
    }
    return caveats;
}
exports.getCaveatsFromMacaroon = getCaveatsFromMacaroon;
/**
 * @description verifyMacaroonCaveats will check if a macaroon is valid or
 * not based on a set of satisfiers to pass as general caveat verifiers. This will also run
 * against caveat.verifyCaveats to ensure that satisfyPrevious will validate
 * @param {string} macaroon A raw macaroon to run a verifier against
 * @param {String} secret The secret key used to sign the macaroon
 * @param {(Satisfier | Satisfier[])} satisfiers a single satisfier or list of satisfiers used to verify caveats
 * @param {Object} [options] An optional options object that will be passed to the satisfiers.
 * In many circumstances this will be a request object, for example when this is used in a server
 * @returns {boolean}
 */
function verifyMacaroonCaveats(rawMac, secret, satisfiers, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
options = {}) {
    try {
        const macaroon = Macaroon.importMacaroon(rawMac);
        const secretBytesArray = (0, helpers_1.stringToBytes)(secret);
        // js-macaroon's verification takes a function as its second
        // arg that runs a check against each caveat which is a less full-featured
        // version of `verifyCaveats` used below since it doesn't support contextual
        // checks like comparing w/ previous caveats for the same condition.
        // we pass this stubbed function so signature checks can be done
        // and satisfier checks will be done next if this passes.
        macaroon.verify(secretBytesArray, () => null);
        const caveats = getCaveatsFromMacaroon(rawMac);
        if (satisfiers && !Array.isArray(satisfiers))
            satisfiers = [satisfiers];
        if (!caveats.length && (!satisfiers))
            return true;
        // check caveats against satisfiers, including previous caveat checks
        return (0, caveat_1.verifyCaveats)(caveats, satisfiers, options);
    }
    catch (e) {
        return false;
    }
}
exports.verifyMacaroonCaveats = verifyMacaroonCaveats;
/**
 * A convenience wrapper for getting a base64 encoded string.
 * We unfortunately can't use the built in tool `Macaroon#bytesToBase64`
 * because it only supports url safe base64 encoding which isn't compatible with
 * aperture
 * @param mac MacaroonClass - a macaroon to convert to raw base64
 * @returns base64 string
 */
function getRawMacaroon(mac, urlSafe = false) {
    const bytes = mac._exportBinaryV2();
    if (urlSafe)
        return (0, base64_1.encodeURLSafe)(bytes);
    return (0, base64_1.encode)(bytes);
}
exports.getRawMacaroon = getRawMacaroon;
//# sourceMappingURL=macaroon.js.map