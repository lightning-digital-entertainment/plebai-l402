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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dotenv = __importStar(require("dotenv"));
const helpers_1 = require("../modules/helpers");
// import { OpenAI } from "langchain/llms/openai";
const openai_1 = __importDefault(require("openai"));
const uuid_1 = require("uuid");
const zep_js_1 = require("@getzep/zep-js");
const vivekdoc_1 = require("../vivekdoc");
const createEvent_1 = require("../modules/nip94event/createEvent");
require("websocket-polyfill");
const createimage_1 = require("../modules/togetherai/createimage");
const helpers_2 = require("../modules/helpers");
dotenv.config();
const wordRegex = /\s+/g;
const sessionId = "";
// const zepClient = new ZepClient(process.env.ZEP_API_URL, process.env.OPENAI_API_KEY);
const createChatCompletion = (content, role, finishReason) => {
    const id = (0, uuid_1.v4)();
    return {
        id: "chatcmpl-" + Buffer.from(id),
        model: "plebai-l402",
        created: Date.now(),
        object: "chat.completion.chunk",
        choices: [
            {
                index: 0,
                delta: {
                    role,
                    content
                },
                finish_reason: finishReason
            }
        ]
    };
};
const l402 = (0, express_1.Router)();
l402.post('/completions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d, _e;
    const body = req.body;
    console.log('body: ', body);
    const sendData = (data) => {
        if (body.stream ? body.stream : false) {
            res.write(`event: completion \n`);
            res.write(`data: ${data}\n\n`);
        }
    };
    const openai = new openai_1.default({
        apiKey: process.env.ROUTER_API_KEY,
        baseURL: process.env.ROUTER_URL,
        defaultHeaders: { "HTTP-Referer": process.env.PLEBAI_URL, "X-Title": 'PlebAI' },
    });
    if (body.system_purpose === 'GenImage') {
        try {
            const prompt = body.messages[body.messages.length - 1].content;
            console.log('ImageGen: ' + body.messages[body.messages.length - 1].content + ' ');
            let content = '';
            const { keyword, modifiedString } = (0, helpers_2.removeKeyword)(content);
            if (keyword) {
                if (keyword === '/photo')
                    content = yield (0, createimage_1.createTogetherAIImageWithPrompt)(modifiedString, 'SG161222/Realistic_Vision_V3.0_VAE', 768, 512);
                if (keyword === '/midjourney')
                    content = yield (0, createimage_1.createTogetherAIImageWithPrompt)(modifiedString, 'prompthero/openjourney', 512, 512);
                console.log('image created with ' + keyword);
            }
            if (content === '')
                content = yield (0, createimage_1.createTogetherAIImageWithPrompt)(prompt, 'stabilityai/stable-diffusion-xl-base-1.0', 1024, 1024);
            sendData(JSON.stringify(createChatCompletion(content, null, null)));
            yield (0, createEvent_1.createNIP94Event)(content, null, body.messages[body.messages.length - 1].content);
            // sendData(JSON.stringify(createChatCompletion( await createImage(body.messages[body.messages.length -1].content) , null, null)));
        }
        catch (error) {
            console.log(error);
            sleep(500);
            sendData(JSON.stringify(createChatCompletion('Unable to create image due to server issue. Please try later...', null, null)));
        }
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
        return;
    }
    if (body.system_purpose === 'Vivek2024' || body.system_purpose === 'DocGPT') {
        console.log('inside Vivek');
        const client = yield zep_js_1.ZepClient.init(process.env.ZEP_API_URL);
        const collection = yield client.document.getCollection(body.system_purpose === 'Vivek2024' ? process.env.COLLECTION_NAME : process.env.MEDICAL_COLLECTION_NAME);
        let searchResult = '';
        try {
            const searchResults = yield collection.search({
                text: body.messages[body.messages.length - 1].content,
            }, 5);
            console.log(`Found ${searchResults.length} documents matching query '${body.messages[body.messages.length - 1].content}'`);
            // printResults(searchResults);
            searchResult = (0, vivekdoc_1.getResults)(searchResults);
            body.messages[0].content = body.messages[0].content + '. Use this information I found on the web: ' + searchResult + ' ';
        }
        catch (error) {
            console.log(error);
        }
    }
    const messages = getMessages(body.messages);
    console.log('Input prompt: ' + JSON.stringify(messages));
    const stream = yield openai.chat.completions.create({
        messages,
        model: body.llm_router,
        max_tokens: body.max_tokens,
        stream: true,
        temperature: body.temperature
    });
    try {
        for (var _f = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _f = true) {
            _c = stream_1_1.value;
            _f = false;
            const part = _c;
            sendData(JSON.stringify(createChatCompletion((_e = (_d = part.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content, null, null)));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_f && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (body.system_purpose === 'Vivek2024')
        sendData(JSON.stringify(createChatCompletion("\n\nTo donate to Vivek's campaign, Go to https://vivek2024.link/donate", null, null)));
    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();
}));
exports.default = l402;
function lsatChallenge(requestBody, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const lsat = yield (0, helpers_1.getLsatToChallenge)(requestBody, parseInt(process.env.SATS_AMOUNT, 10));
        return res.setHeader('WWW-Authenticate', lsat.toChallenge()).status(402).send('');
    });
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
const getMessages = (messages) => {
    if (messages.length > 8) {
        const firstMessage = messages[0];
        const lastFiveMessages = messages.slice(-5);
        return [firstMessage, ...lastFiveMessages];
    }
    else
        return messages;
};
//# sourceMappingURL=chat.js.map