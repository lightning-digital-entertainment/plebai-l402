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
const openai_1 = __importDefault(require("openai"));
const uuid_1 = require("uuid");
const zep_js_1 = require("@getzep/zep-js");
const vivekdoc_1 = require("../vivekdoc");
const createEvent_1 = require("../modules/nip94event/createEvent");
require("websocket-polyfill");
const createimage_1 = require("../modules/togetherai/createimage");
const helpers_2 = require("../modules/helpers");
const data_1 = require("./data");
const createimage_2 = require("../modules/sinkin/createimage");
const animateDiffuse_1 = require("../modules/randomseed/animateDiffuse");
const txt2img_1 = require("../modules/randomseed/txt2img");
const chatCompletion_1 = require("../modules/openai/chatCompletion");
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
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const openRouter = new openai_1.default({
    apiKey: process.env.ROUTER_API_KEY,
    baseURL: process.env.ROUTER_URL,
    defaultHeaders: { "HTTP-Referer": process.env.PLEBAI_URL, "X-Title": 'PlebAI' },
});
const gputopia = new openai_1.default({
    apiKey: process.env.GPUTOPIA_API_KEY,
    baseURL: process.env.GPUTOPIA_WEBHOOK_URL,
});
l402.post('/completions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d, _e, _f, _g;
    const body = req.body;
    console.log('body: ', body);
    let summaryTokens = '';
    const userMessage = body.messages[body.messages.length - 1].content;
    const agentData = yield (0, data_1.getAgentById)(body.system_purpose);
    console.log('agentData: ', agentData);
    try {
        const prompt = body.messages[body.messages.length - 1].content;
        if ((agentData === null || agentData === void 0 ? void 0 : agentData.req_type) !== null && (agentData === null || agentData === void 0 ? void 0 : agentData.req_type) === 'openai') {
            let response = null;
            try {
                if ((agentData === null || agentData === void 0 ? void 0 : agentData.modelid) && (agentData === null || agentData === void 0 ? void 0 : agentData.modelid.startsWith('thread_'))) {
                    response = yield (0, chatCompletion_1.textResponseWithZep)(agentData, body.messages);
                }
                else {
                    body.messages[body.messages.length - 1].content =
                        [
                            { "type": "text", "text": prompt },
                            JSON.parse((0, helpers_1.extractUrls)(prompt)),
                        ];
                    console.log(body.messages[body.messages.length - 1].content);
                    const result = yield (0, chatCompletion_1.visionResponse)(agentData === null || agentData === void 0 ? void 0 : agentData.llmrouter, body.messages);
                    response = result.choices[0].message.content;
                    // delete the uploaded image if it our S3.
                    body.messages[body.messages.length - 1].content.filter((item) => { var _a; return item.type === 'image_url' && ((_a = item.image_url) === null || _a === void 0 ? void 0 : _a.url); })
                        .map((item) => __awaiter(void 0, void 0, void 0, function* () { return yield (0, helpers_1.deleteImageUrl)(item.image_url.url); }));
                }
            }
            catch (error) {
                console.log(error);
            }
            if (response) {
                console.log(response);
                if (body === null || body === void 0 ? void 0 : body.stream) {
                    sendStream(JSON.stringify(createChatCompletion(response, null, null)), res);
                    yield sleep(1000);
                    endStream(res);
                }
                else {
                    res.send(response);
                }
                // save data for logs.
                yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, response, req.body, req.body]);
                return;
            }
        }
        if ((agentData === null || agentData === void 0 ? void 0 : agentData.req_type) !== null && (agentData === null || agentData === void 0 ? void 0 : agentData.req_type) === 'gputopia') {
            let response = null;
            try {
                response = yield gputopia.chat.completions.create({
                    model: "TheBloke/vicuna-7B-v1.5-GGUF:Q4_K_M",
                    messages: body.messages
                });
            }
            catch (error) {
                /*
                response = {
    
                  choices: [ { index: 0, message: {role: 'assistant',
                  content: "An error occured when accessing GPUtopia. instead, here is a joke to make you laugh. Why don't computers make good comedians? Because they can't handle a hard drive crash without losing their memory! "}, finish_reason: 'stop' } ]
                }
    
                */
                console.log(error);
            }
            if (response) {
                if (body === null || body === void 0 ? void 0 : body.stream) {
                    sendStream(JSON.stringify(createChatCompletion(response.choices[0].message.content.trim(), null, null)), res);
                    yield sleep(1000);
                    endStream(res);
                }
                else {
                    res.send(response.choices[0].message.content.trim());
                }
                // save data for logs.
                yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, response.choices[0].message.content.trim(), req.body, req.body]);
                return;
            }
        }
        if ((agentData === null || agentData === void 0 ? void 0 : agentData.req_type) !== null && (agentData === null || agentData === void 0 ? void 0 : agentData.req_type) === 'randomseed') {
            if ((agentData === null || agentData === void 0 ? void 0 : agentData.modelid) === 'remove-background') {
                const response = yield (0, txt2img_1.removeBackground)((0, helpers_1.extractUrl)(prompt));
                if (!response || !response.image_url)
                    response.image_url = 'With a roaring thunder, Image generation failed. To request refund, Please contact us on Discord. ';
                summaryTokens = response.image_url;
                if (body === null || body === void 0 ? void 0 : body.stream) {
                    sendStream(JSON.stringify(createChatCompletion(response.image_url, null, null)), res);
                    yield sleep(1000);
                    endStream(res);
                }
                else {
                    res.send(response.image_url);
                }
                // save data for logs.
                yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, summaryTokens, req.body, req.body]);
                return;
            }
            if (agentData === null || agentData === void 0 ? void 0 : agentData.genanimation) {
                const trackId = (0, helpers_1.generateRandom9DigitNumber)();
                const response = yield (0, animateDiffuse_1.createAnimateDiffuseWithPrompt)(prompt, agentData.modelid, trackId);
                if (response) {
                    const result = yield (0, data_1.getAnimateData)(trackId);
                    console.log(result.output.image_urls[0]);
                    summaryTokens = result.output.image_urls[0];
                    if (body === null || body === void 0 ? void 0 : body.stream) {
                        sendStream(JSON.stringify(createChatCompletion(result.output.image_urls[0], null, null)), res);
                        yield sleep(1000);
                        endStream(res);
                    }
                    else {
                        res.send(result.output.image_urls[0]);
                    }
                    // save data for logs.
                    yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, summaryTokens, req.body, req.body]);
                    return;
                }
            }
            if (agentData === null || agentData === void 0 ? void 0 : agentData.genimage) {
                try {
                    console.log('prompt: ', prompt);
                    const lora = ' ' + (agentData === null || agentData === void 0 ? void 0 : agentData.lora) ? agentData === null || agentData === void 0 ? void 0 : agentData.lora : '';
                    const response = yield (0, txt2img_1.createTxt2ImgWithPrompt)((prompt + lora), agentData.modelid, agentData.image_height ? agentData.image_height : 1024, agentData.image_width ? agentData.image_width : 1024);
                    if (response) {
                        if (body === null || body === void 0 ? void 0 : body.stream) {
                            sendStream(JSON.stringify(createChatCompletion(response.output[0], null, null)), res);
                            yield sleep(1000);
                            endStream(res);
                        }
                        else {
                            res.send(response.output[0]);
                        }
                        // save data for logs.
                        yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, response.output[0], req.body, req.body]);
                        yield (0, createEvent_1.createNIP94Event)(response.output[0], null, body.messages[body.messages.length - 1].content);
                    }
                }
                catch (error) {
                    console.log(error);
                }
                return;
            }
        }
        if (agentData && (agentData === null || agentData === void 0 ? void 0 : agentData.genimage) && (agentData === null || agentData === void 0 ? void 0 : agentData.modelid)) {
            try {
                let content = '';
                if (agentData === null || agentData === void 0 ? void 0 : agentData.lora) {
                    if (content === '')
                        content = yield (0, createimage_2.createSinkinImageWithPromptandLora)(prompt, agentData.modelid, agentData.lora);
                }
                else {
                    if (content === '')
                        content = yield (0, createimage_2.createSinkinImageWithPrompt)(prompt, agentData.modelid);
                }
                const imageString = yield (0, helpers_1.getBase64ImageFromURL)(content);
                const id = (0, uuid_1.v4)();
                (0, helpers_1.saveBase64AsImageFile)(id + '.png', imageString);
                const currentImageString = yield (0, helpers_1.getImageUrl)(id, 'png');
                if (body === null || body === void 0 ? void 0 : body.stream) {
                    sendStream(JSON.stringify(createChatCompletion(currentImageString, null, null)), res);
                }
                else {
                    res.send(currentImageString);
                }
                yield (0, createEvent_1.createNIP94Event)(currentImageString, null, body.messages[body.messages.length - 1].content);
            }
            catch (error) {
                console.log(error);
            }
            if (body === null || body === void 0 ? void 0 : body.stream)
                endStream(res);
            // save data for logs.
            yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, summaryTokens, req.body, req.body]);
            return;
        }
    }
    catch (error) {
        console.log('In catch checking if it is genImage agent: ', error);
    }
    if (body.system_purpose === 'GenImage') {
        try {
            const prompt = body.messages[body.messages.length - 1].content;
            console.log('ImageGen: ' + body.messages[body.messages.length - 1].content + ' ');
            let content = '';
            const { keyword, modifiedString } = (0, helpers_2.removeKeyword)(prompt);
            if (keyword) {
                if (keyword === '/photo')
                    content = yield (0, createimage_1.createTogetherAIImageWithPrompt)(modifiedString, 'SG161222/Realistic_Vision_V3.0_VAE', 768, 512);
                if (keyword === '/midjourney')
                    content = yield (0, createimage_1.createTogetherAIImageWithPrompt)(modifiedString, 'prompthero/openjourney', 512, 512);
                console.log('image created with ' + keyword);
            }
            if (content === '')
                content = yield (0, createimage_1.createTogetherAIImageWithPrompt)(prompt, 'stabilityai/stable-diffusion-xl-base-1.0', 1024, 1024);
            summaryTokens = content;
            if (body === null || body === void 0 ? void 0 : body.stream) {
                sendStream(JSON.stringify(createChatCompletion(content, null, null)), res);
            }
            else {
                res.send(content);
            }
            yield (0, createEvent_1.createNIP94Event)(content, null, body.messages[body.messages.length - 1].content);
            // sendData(JSON.stringify(createChatCompletion( await createImage(body.messages[body.messages.length -1].content) , null, null)));
        }
        catch (error) {
            console.log(error);
            sleep(500);
            sendStream(JSON.stringify(createChatCompletion('Unable to create image due to server issue. Please try later...', null, null)), res);
        }
        if (body === null || body === void 0 ? void 0 : body.stream)
            endStream(res);
        // save data for logs.
        yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, summaryTokens, req.body, req.body]);
        return;
    }
    if (agentData.getzep) {
        console.log('getting embedding data from Zep');
        try {
            const client = yield zep_js_1.ZepClient.init(process.env.ZEP_API_URL);
            const collection = yield client.document.getCollection(agentData.collectionname ? agentData.collectionname : '');
            let searchResult = '';
            const searchResults = yield collection.search({
                text: body.messages[body.messages.length - 1].content,
            }, 3);
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
    if (body === null || body === void 0 ? void 0 : body.stream) {
        try {
            const stream = yield openRouter.chat.completions.create({
                messages,
                model: body.llm_router,
                max_tokens: body.max_tokens,
                stream: true,
                temperature: body.temperature
            });
            try {
                for (var _h = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _h = true) {
                    _c = stream_1_1.value;
                    _h = false;
                    const part = _c;
                    summaryTokens = summaryTokens + ((_e = (_d = part.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content);
                    sendStream(JSON.stringify(createChatCompletion((_g = (_f = part.choices[0]) === null || _f === void 0 ? void 0 : _f.delta) === null || _g === void 0 ? void 0 : _g.content, null, null)), res);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_h && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (body.system_purpose === 'Vivek2024')
                sendStream(JSON.stringify(createChatCompletion("\n\nTo donate to Vivek's campaign, Go to https://vivek2024.link/donate", null, null)), res);
        }
        catch (error) {
            console.log(error);
        }
        if (agentData === null || agentData === void 0 ? void 0 : agentData.suggestion) {
            const questionStream = yield openRouter.chat.completions.create({
                messages: [
                    { "role": "system", "content": "can you suggest not more than two related conversational question for the user to ask back to you chatGPT? These questions have to be leading questions for the user to continue the conversation. respond with only questions and end each question with '\n'. Do not include hyphens or number ``` " },
                    { "role": "user", "content": summaryTokens + ' ```' }
                ],
                model: 'mistralai/mistral-7b-instruct',
                max_tokens: 1024,
                stream: false,
                temperature: 0.1
            });
            sendStream(JSON.stringify(createChatCompletion("\nQuestions:- \n", null, null)), res);
            sendStream(JSON.stringify(createChatCompletion(questionStream.choices[0].message.content, null, null)), res);
        }
        // end stream
        endStream(res);
    }
    else {
        try {
            const stream = yield openRouter.chat.completions.create({
                messages,
                model: body.llm_router,
                max_tokens: body.max_tokens,
                stream: false,
                temperature: body.temperature
            });
            console.log('stream', stream);
            res.send(stream.choices[0].message.content);
        }
        catch (error) {
            console.log(error);
            res.send('Error in getting response. Please try again later. ');
        }
    }
    yield (0, data_1.insertData)("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint ? body.app_fingerprint : (0, uuid_1.v4)(), body.llm_router, body.system_purpose, userMessage.length > 2000 ? userMessage.substring(0, 1998) : userMessage, summaryTokens, req.body, req.body]);
}));
exports.default = l402;
function sendStream(data, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.write(`event: completion \n`);
        res.write(`data: ${data}\n\n`);
    });
}
function endStream(res) {
    return __awaiter(this, void 0, void 0, function* () {
        sendStream(JSON.stringify(createChatCompletion(null, '', 'stop')), res);
        sendStream('[DONE]', res);
        res.end();
    });
}
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