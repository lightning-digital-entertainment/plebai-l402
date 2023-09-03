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
const createImage_1 = require("./genimage/createImage");
const dotenv = __importStar(require("dotenv"));
const nostr_tools_1 = require("nostr-tools");
require("websocket-polyfill");
const helpers_1 = require("./helpers");
dotenv.config();
const getRandomElement = (arr) => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
};
function genPostImage() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const randomRow:string = readRandomRow(process.env.UPLOAD_PATH + 'imageprompts.csv');
            const input1 = ['close up', 'upper body'];
            const input2 = ['indianasin <lora:asin_model:0.5>', 'trisha  <lora:trisha_model:0.5>', 'trisha  <lora:trisha_model:0.5> <lyco:MarLucas-RealVision-V1.0:0.8>', 'arao <lora:Amrita_Rao_SD15_LoRA:0.5>', '<lora:pranalira:0.5>', ' karisa <lora:karisa:0.5>', 'ketika  <lyco:Ketika SharmaV3:0.5>', '<lyco:MarLucas-RealVision-V1.0:0.8>', 'ketika  <lyco:Ketika SharmaV3:0.5> <lora:trisha_model:0.5>'];
            const input3 = ['small', 'busty'];
            const input4 = ['red', 'green', 'violet', 'pink'];
            let randomRow = '{input1} of a {input2} indian  woman  goddess, who looks at you in a Demandingly way with two beautiful green eyes , {input3} breasts,  {input4} saree, very seductive pose, necklace, jewelry, upper body,  outdoor, night, restaurant, attractive pose, red lips, sexy girl, gorgeous lady, lovely woman, gorgeous woman ';
            randomRow = randomRow.replace('{input1}', getRandomElement(input1));
            randomRow = randomRow.replace('{input2}', getRandomElement(input2));
            randomRow = randomRow.replace('{input3}', getRandomElement(input3));
            randomRow = randomRow.replace('{input4}', getRandomElement(input4));
            console.log('Prompt: ', randomRow);
            const imageURL = yield (0, createImage_1.createImage)(randomRow.replace(/"/g, ''), 512, 768, true);
            if (imageURL === null)
                return;
            const content = imageURL + '\n #ai #zap #art #memes #pleb #PlebAI';
            const tags = [];
            tags.push(['t', 'aiart']);
            tags.push(['t', 'memes']);
            tags.push(['t', 'PlebAI']);
            tags.push(['t', 'Images']);
            // tags.push();
            const event = {
                kind: 1,
                pubkey: (0, nostr_tools_1.getPublicKey)(process.env.SK3),
                created_at: Math.floor(Date.now() / 1000),
                tags,
                content
            };
            event.id = (0, nostr_tools_1.getEventHash)(event);
            event.sig = (0, nostr_tools_1.getSignature)(event, process.env.SK3);
            console.log(event);
            (0, helpers_1.publishRelays)(event);
            const tags2 = [];
            tags2.push(['url', imageURL]);
            tags2.push(['m', 'image/png']);
            tags2.push(['dim', '512x768']);
            /*
            const description_hash =  Buffer.from('u._hash(req.query.nostr)', 'hex').toString('base64');
            const nip94event: NostrEvent = {
                kind: 1063,
                pubkey: getPublicKey(process.env.SK3),
                created_at: Math.floor(Date.now() / 1000),
                tags,
                content:''
            } as any;
    
    
            event.id = getEventHash(nip94event);
            event.sig = getSignature(nip94event, process.env.SK3);
    
            console.log(nip94event);
    
            publishRelays(nip94event);
            */
        }
        catch (error) {
            console.log('In catch with error: ', error);
        }
    });
}
genPostImage();
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const randomTime = getRandomInterval(600000, 900000); // between 1 to 3 minutes in milliseconds
const timerId = setInterval(() => {
    genPostImage();
}, randomTime);
console.log('The End');
//# sourceMappingURL=desiimage.js.map