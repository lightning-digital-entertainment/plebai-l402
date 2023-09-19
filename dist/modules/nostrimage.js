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
exports.genPostImage = void 0;
const dotenv = __importStar(require("dotenv"));
const nostr_tools_1 = require("nostr-tools");
require("websocket-polyfill");
const helpers_1 = require("./helpers");
const createText2Image_1 = require("./getimage/createText2Image");
const createEvent_1 = require("./nip94event/createEvent");
dotenv.config();
function genPostImage() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prompt = (0, helpers_1.readRandomRow)(process.env.UPLOAD_PATH + 'imageprompts.csv');
            const imageURL = yield (0, createText2Image_1.createGetImageWithPrompt)(prompt + ' in portrait');
            console.log('ImageGen: ' + prompt + ' ' + imageURL);
            if (imageURL === null)
                return;
            const content = "Prompt: " + prompt + "\n " + imageURL + '\n #zapathon #bitcoin #nostr #plebchain #grownostr #zap #art #memes #pleb #PlebAI';
            const tags = [];
            tags.push(['t', 'zapathon']);
            tags.push(['t', 'plebchain']);
            tags.push(['t', 'grownostr']);
            tags.push(['t', 'aiart']);
            tags.push(['t', 'plebai']);
            tags.push(['t', 'memes']);
            tags.push(['t', 'zap']);
            tags.push(['t', 'pleb']);
            // tags.push();
            const event = {
                kind: 1,
                pubkey: (0, nostr_tools_1.getPublicKey)(process.env.SK1),
                created_at: Math.floor(Date.now() / 1000),
                tags,
                content
            };
            event.id = (0, nostr_tools_1.getEventHash)(event);
            event.sig = (0, nostr_tools_1.getSignature)(event, process.env.SK1);
            console.log(event);
            (0, helpers_1.publishRelays)(event);
            yield (0, createEvent_1.createNIP94Event)(imageURL, null, content);
        }
        catch (error) {
            console.log('In catch with error: ', error);
        }
    });
}
exports.genPostImage = genPostImage;
// genPostImage();
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const randomTime = getRandomInterval(1800000, 3600000); // between 1 to 3 minutes in milliseconds
const timerId = setInterval(() => {
    genPostImage();
}, randomTime);
console.log('The End');
//# sourceMappingURL=nostrimage.js.map