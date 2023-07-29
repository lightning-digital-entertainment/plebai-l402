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
const tools_1 = require("langchain/tools");
const helpers_1 = require("../modules/helpers");
const agents_1 = require("langchain/agents");
const webbrowser_1 = require("langchain/tools/webbrowser");
const calculator_1 = require("langchain/tools/calculator");
const openai_2 = require("langchain/embeddings/openai");
const openai_3 = require("langchain/llms/openai");
const uuid_1 = require("uuid");
const output_parsers_1 = require("langchain/output_parsers");
dotenv.config();
const wordRegex = /\s+/g;
let sessionId = "";
const zepClient = new zep_js_1.ZepClient(process.env.ZEP_API_URL, process.env.OPENAI_API_KEY);
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
    // included 'localhost' for local dev/test. Use ip address if you want to run locally and return 402.
    if (!req.headers.host.startsWith('localhost') && !req.headers.authorization) {
        // no auth found. so create macroon, invoice and send it back to client with 402
        return lsatChallenge(req.body, res);
    }
    if (!req.headers.host.startsWith('localhost') && req.headers.authorization) {
        // validate Auth and confirm
        if (!((0, helpers_1.vetifyLsatToken)(req.headers.authorization, req.body)))
            return lsatChallenge(req.body, res);
    }
    // if you are here, then it is localhost or L402 Auth passed.
    const body = req.body;
    console.log('body: ', body);
    const sendData = (data) => {
        if (body.stream ? body.stream : false) {
            res.write(`event: completion \n`);
            res.write(`data: ${data}\n\n`);
        }
    };
    if (body.stream ? body.stream : false) {
        res.writeHead(200, (0, helpers_1.sendHeaders)(true));
        sendData(JSON.stringify(createChatCompletion(null, 'assistant', null)));
    }
    // This is used in plebAI.com
    if (body.system_purpose === 'Developer' || body.system_purpose === 'Teacher') {
        body.stream = false;
        const headerRequest = {
            'Content-Type': 'application/json',
        };
        const response = yield fetch(process.env.LLAMA_7B, { headers: headerRequest, method: 'POST', body: JSON.stringify(body) });
        const token = yield response.json();
        body.stream = true;
        console.log(token.choices[0].message);
        sendData(JSON.stringify(createChatCompletion(token.choices[0].message.content, null, null)));
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
        return;
    }
    let summaryTokens = '';
    // This is used in PlebAI.com
    if (body.system_purpose === 'OrangePill') {
        const model = new openai_3.OpenAI({ temperature: 0, modelName: 'davinci-search-query' });
        const chat2 = new openai_1.ChatOpenAI({ temperature: 0.5, modelName: 'gpt-4-0314',
            streaming: true,
            callbacks: [
                {
                    handleLLMNewToken(token) {
                        summaryTokens = summaryTokens + token;
                        sendData(JSON.stringify(createChatCompletion(token, null, null)));
                    },
                },
            ],
        });
        const embeddings = new openai_2.OpenAIEmbeddings();
        const tools = [
            new tools_1.SerpAPI(process.env.SERP_API_KEY, {
                hl: "en",
                gl: "us",
            }),
            new calculator_1.Calculator(),
            new webbrowser_1.WebBrowser({ model, embeddings }),
        ];
        try {
            const executor = yield (0, agents_1.initializeAgentExecutorWithOptions)(tools, chat2, {
                agentType: "structured-chat-zero-shot-react-description",
                returnIntermediateSteps: true,
            });
            // const input = body.messages.map((message: Message) => message.content).join(' ');
            yield executor.call({ input: body.messages[0].content + ' ' + body.messages[body.messages.length - 1].content });
        }
        catch (error) {
            console.log('In catch with error: ', error);
            sendData(JSON.stringify(createChatCompletion('\n\n  Error occurred when searching for an answer. Can you retry again? ', null, null)));
        }
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
        return;
    }
    const chat = new openai_1.ChatOpenAI({ temperature: 0.5, modelName: 'gpt-3.5-turbo-16k-0613',
        streaming: true,
        callbacks: [
            {
                handleLLMNewToken(token) {
                    summaryTokens = summaryTokens + token;
                    sendData(JSON.stringify(createChatCompletion(token, null, null)));
                },
            },
        ],
    });
    let link = '';
    try {
        console.log('inside trying to get the video link ');
        link = YouTubeGetID(body.messages[1].content);
        console.log('link from content is: %o', link);
    }
    catch (error) {
        console.log('Error: ', error);
    }
    // try another way to get the link
    if (link === '') {
        try {
            console.log('inside trying to get the video link using ChatpGPT');
            const parser = output_parsers_1.StructuredOutputParser.fromNamesAndDescriptions({
                videoID: "Youtube video ID"
            });
            const formatInstructions = parser.getFormatInstructions();
            const prompt = new prompts_1.PromptTemplate({
                template: "Get the youtube video ID from this text .\n{format_instructions}\n{question}",
                inputVariables: ["question"],
                partialVariables: { format_instructions: formatInstructions },
            });
            const model = new openai_3.OpenAI({ temperature: 0 });
            const input = yield prompt.format({
                question: body.messages[1].content,
            });
            const promptResponse = yield model.call(input);
            console.log('Input: ', input);
            console.log('Response: ', promptResponse);
            const listResponse = yield parser.parse(promptResponse);
            console.log(listResponse);
        }
        catch (error) {
            console.log('incatch with error: ', error);
        }
    }
    const params = {
        api_key: process.env.SERP_API_KEY,
        search_query: link !== '' ? link : body.messages[1].content
    };
    const serpResponse = yield (0, serpapi_1.getJson)("youtube", params);
    console.log(serpResponse);
    link = serpResponse.video_results[0].link;
    // sendData(JSON.stringify(createChatCompletion( serpResponse.video_results[0].thumbnail.static + ' \n', null, null)));
    link = YouTubeGetID(link);
    console.log('link is: %o', link);
    summaryTokens = 'Found the Youtube video ... ' + serpResponse.video_results[0].title
        + ' with video length: ' + serpResponse.video_results[0].length
        + ' with views: ' + serpResponse.video_results[0].views
        + ' published ' + serpResponse.video_results[0].published_date
        + ' and youtube link: ' + serpResponse.video_results[0].link + '\n ';
    sessionId = link;
    const memory = new zep_1.ZepMemory({
        sessionId,
        baseURL: process.env.ZEP_API_URL,
        apiKey: process.env.OPENAI_API_KEY,
    });
    const pastHistory = yield memory.loadMemoryVariables({});
    if (body.messages.length === 2) {
        try {
            sendData(JSON.stringify(createChatCompletion(summaryTokens, null, null)));
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
                if (body.stream ? body.stream : false) {
                    sendData(JSON.stringify(createChatCompletion('\n\n Here are suggested questions to ask and learn more about: \n ', null, null)));
                }
                else {
                    summaryTokens = summaryTokens + '\n\n Here are suggested questions to ask and learn more about: \n ';
                }
                yield chat.call([
                    new schema_1.HumanMessage("Can you suggest five questions from this summary? " + summaryTokens),
                ]);
                if (pastHistory.history === '') {
                    const history = [
                        { role: "human", content: "Here is the summary of the transscript for youtube video  " + summaryTokens }
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
        try {
            const prompt = prompts_1.PromptTemplate.fromTemplate(' Please use transcript to answer the prompt. {history}  {input} ');
            const chain = new chains_1.ConversationChain({ llm: chat, prompt, memory });
            yield chain.call({ input: body.messages[body.messages.length - 1].content });
        }
        catch (error) {
            console.log('In catch with error: %o', error);
            sendData(JSON.stringify(createChatCompletion('\n I am not able to find any youtube video with a transcript. Can you please try with a different search? \n ', null, null)));
        }
    }
    if (body.stream ? body.stream : false) {
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
    }
    else {
        res.setHeader('Content-Type', 'application/json').send(JSON.stringify(createChatCompletion(summaryTokens, 'assistant', 'stop')));
    }
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