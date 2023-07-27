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
const express_1 = require("express");
const openai_1 = require("langchain/chat_models/openai");
const schema_1 = require("langchain/schema");
const dotenv = __importStar(require("dotenv"));
const serpapi_1 = require("serpapi");
const youtube_transcript_1 = require("youtube-transcript");
const zep_1 = require("langchain/memory/zep");
const zep_js_1 = require("@getzep/zep-js");
const prompts_1 = require("langchain/prompts");
const chains_1 = require("langchain/chains");
const helpers_1 = require("../modules/helpers");
dotenv.config();
const wordRegex = /\s+/g;
let sessionId = "";
const zepClient = new zep_js_1.ZepClient(process.env.ZEP_API_URL, process.env.OPENAI_API_KEY);
const createChatCompletion = (content, role, finishReason) => {
    return {
        id: "chatcmpl-500307f7-4a6c-4c7b-8caf-6d44bfc4220b",
        model: "gpt-4-all",
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
l402.post('/testing', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.headers);
    if (req.headers.authorization) {
        // validate Auth and confirm
        if (!((0, helpers_1.vetifyLsatToken)(req.headers.authorization, req.body)))
            return lsatChallenge(req.body, res);
        // All good to execute
        res.status(200).send('Success');
    }
    else {
        // no auth found. so create macroon, invoice and send it back to client with 402
        return lsatChallenge(req.body, res);
    }
}));
l402.post('/completions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    console.log('Body: ', body);
    console.log(req.headers.host);
    const headers = {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Connection': 'keep-alive',
        'server': 'uvicorn',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked'
    };
    res.writeHead(200, headers);
    const sendData = (data) => {
        res.write(`event: completion \n`);
        res.write(`data: ${data}\n\n`);
    };
    sendData(JSON.stringify(createChatCompletion(null, 'assistant', null)));
    if (body.system_purpose === 'Developer' || body.system_purpose === 'Teacher') {
        body.stream = false;
        const headerRequest = {
            'Content-Type': 'application/json',
        };
        const response = yield fetch(process.env.LLAMA_7B, { headers: headerRequest, method: 'POST', body: JSON.stringify(body) });
        const token = yield response.json();
        console.log(token.choices[0].message);
        sendData(JSON.stringify(createChatCompletion(token.choices[0].message.content, null, null)));
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
        return;
    }
    let summaryTokens = '';
    const chat = new openai_1.ChatOpenAI({ temperature: 0.5, modelName: 'gpt-3.5-turbo-16k-0613',
        streaming: true,
        callbacks: [
            {
                handleLLMNewToken(token) {
                    summaryTokens = summaryTokens + ' ' + token;
                    sendData(JSON.stringify(createChatCompletion(token, null, null)));
                },
            },
        ],
    });
    let link = '';
    const params = {
        api_key: process.env.SERP_API_KEY,
        search_query: body.messages[1].content
    };
    const serpResponse = yield (0, serpapi_1.getJson)("youtube", params);
    console.log(serpResponse);
    link = serpResponse.video_results[0].link;
    // sendData(JSON.stringify(createChatCompletion( serpResponse.video_results[0].thumbnail.static + ' \n', null, null)));
    link = YouTubeGetID(link);
    console.log('link is: %o', link);
    sessionId = link;
    const memory = new zep_1.ZepMemory({
        sessionId,
        baseURL: process.env.ZEP_API_URL,
        apiKey: process.env.OPENAI_API_KEY,
    });
    const pastHistory = yield memory.loadMemoryVariables({});
    if (body.messages.length === 2) {
        try {
            sendData(JSON.stringify(createChatCompletion('Found the Youtube video ... ' + serpResponse.video_results[0].title + '\n ', null, null)));
            sendData(JSON.stringify(createChatCompletion('Searching YouTube to get the transcript.... \n', null, null)));
            if (link.length > 0) {
                const transcript = yield youtube_transcript_1.YoutubeTranscript.fetchTranscript(link);
                const extractedTextsArray = transcript.map((data) => data.text);
                const extractedText = extractedTextsArray.join(' ');
                // console.log(extractedText);
                const chunkSize = 16000;
                const stringChunks = splitStringIntoChunks(extractedText, chunkSize);
                sendData(JSON.stringify(createChatCompletion("Here's transcript summary: \n", null, null)));
                for (const chunk of stringChunks) {
                    yield chat.call([
                        new schema_1.SystemMessage(body.messages[0]),
                        new schema_1.HumanMessage(chunk),
                    ]);
                }
                sendData(JSON.stringify(createChatCompletion('\n Here are suggested questions to ask: \n ', null, null)));
                yield chat.call([
                    new schema_1.HumanMessage("Can you suggest five questions from this summary? " + summaryTokens),
                ]);
                if (pastHistory.history === '') {
                    const history = [
                        { role: "human", content: "Here is the summary of the transscript for youtube video  " + serpResponse.video_results[0].title + ' ' + summaryTokens }
                    ];
                    const messages = history.map(({ role, content }) => new zep_js_1.Message({ role, content }));
                    const memory2 = new zep_js_1.Memory({ messages });
                    const resultUpdate = yield zepClient.addMemory(sessionId, memory2);
                    console.log('Zep Update: %o', resultUpdate);
                }
            }
        }
        catch (error) {
            console.log('In catch with error: %o', error);
            sendData(JSON.stringify(createChatCompletion('\n I am not able to find any youtube video with a transcript. Can you please try with a different search? \n ', null, null)));
        }
    }
    else {
        console.log('In else...');
        const prompt = prompts_1.PromptTemplate.fromTemplate(' Please use transcript to answer the prompt. {history}  {input} ');
        const chain = new chains_1.ConversationChain({ llm: chat, prompt, memory });
        yield chain.call({ input: body.messages[body.messages.length - 1].content });
    }
    sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
    sendData('[DONE]');
    res.end();
}));
exports.default = l402;
function YouTubeGetID(url) {
    url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return (url[2] !== undefined) ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
}
function splitStringIntoChunks(str, chunkSize) {
    const words = str.split(/\s+/); // Split the string into an array of words
    const chunks = [];
    let currentChunk = '';
    for (const word of words) {
        if ((currentChunk + word).length <= chunkSize) {
            currentChunk += (currentChunk === '' ? '' : ' ') + word;
        }
        else {
            chunks.push(currentChunk);
            currentChunk = word;
        }
    }
    if (currentChunk !== '') {
        chunks.push(currentChunk);
    }
    return chunks;
}
function lsatChallenge(requestBody, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const lsat = yield (0, helpers_1.getLsatToChallenge)(requestBody, parseInt(process.env.SATS_AMOUNT, 10));
        return res.setHeader('WWW-Authenticate', lsat.toChallenge()).status(402).send('');
    });
}
//# sourceMappingURL=chat.js.map