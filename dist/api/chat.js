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
const zep_js_2 = require("@getzep/zep-js");
const vivekdoc_1 = require("../vivekdoc");
const createText2Image_1 = require("../modules/getimage/createText2Image");
const createEvent_1 = require("../modules/nip94event/createEvent");
require("websocket-polyfill");
dotenv.config();
const wordRegex = /\s+/g;
let sessionId = "";
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
l402.post('/medical2023', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside medical2023');
    const client = yield zep_js_2.ZepClient.init(process.env.ZEP_API_URL);
    const collection = yield client.document.getCollection(process.env.MEDICAL_COLLECTION_NAME);
    console.log(req.body.content);
    let searchResult = '';
    try {
        const searchResults = yield collection.search({
            text: req.body.content,
        }, 5);
        console.log(`Found ${searchResults.length} documents matching query '${req.body.content}'`);
        // printResults(searchResults);
        searchResult = (0, vivekdoc_1.getResults)(searchResults);
    }
    catch (error) {
        console.log(error);
    }
    const llm = new openai_1.ChatOpenAI({
        temperature: 0.5,
        modelName: 'gpt-3.5-turbo-16k-0613',
        streaming: false
    });
    console.log('Searchresult: ', searchResult);
    const tools = [
        new tools_1.SerpAPI(process.env.SERP_API_KEY, {
            hl: "en",
            gl: "us",
        }),
    ];
    const chatChain = new openai_1.ChatOpenAI({ modelName: "gpt-3.5-turbo-16k-0613", temperature: 0 });
    const executor = yield (0, agents_1.initializeAgentExecutorWithOptions)(tools, chatChain, {
        agentType: "openai-functions",
        verbose: true,
    });
    const result = yield executor.run(' Use this as an sample information I found to answer user input ' + searchResult + '. Here is my input: ' + req.body.content);
    console.log('executor: ', result);
    const systemplate = "You are now an AI modeled after a medical practioner, If the patient's age and gender are not provided, please ask for this information first. Based on the information provided please answer the user question. Please consider both traditional and holistic approaches, and list potential side effects or risks associated with each recommendation. ";
    const systemMessagePrompt = prompts_1.SystemMessagePromptTemplate.fromTemplate(systemplate);
    const humanTemplate = "{input}";
    const humanMessagePrompt = prompts_1.HumanMessagePromptTemplate.fromTemplate(humanTemplate);
    const prompt = prompts_1.ChatPromptTemplate.fromPromptMessages([
        systemMessagePrompt,
        humanMessagePrompt
    ]);
    const chain = new chains_1.ConversationChain({ llm, prompt });
    const response = yield chain.call({ input: req.body.content + ' Use this as an sample information I found to answer user input ```' + result + '``` ' });
    response.response = response.response + "\n\nDisclaimer: The answers provided by this Artificial Intelligence system are intended solely for reference and informational purposes. They should not be construed as professional medical advice, diagnosis, or treatment. Reliance on any information provided by this system is solely at the user's risk. These answers are not a substitute for the expertise and judgment of healthcare professionals and are not to be considered as the definitive medical opinion or as legally binding for the providers involved. In the event of a medical emergency, contact emergency services immediately.  ";
    console.log(response);
    res.send(response);
}));
l402.post('/vivek2024', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside Vivek2024');
    const tools = [
        new tools_1.SerpAPI(process.env.SERP_API_KEY, {
            hl: "en",
            gl: "us",
        }),
    ];
    const client = yield zep_js_2.ZepClient.init(process.env.ZEP_API_URL);
    const collection = yield client.document.getCollection(process.env.COLLECTION_NAME);
    console.log(req.body.content);
    let searchResult = '';
    try {
        const searchResults = yield collection.search({
            text: 'Vivek Ramaswamy ' + req.body.content,
        }, 5);
        console.log(`Found ${searchResults.length} documents matching query '${req.body.content}'`);
        // printResults(searchResults);
        searchResult = (0, vivekdoc_1.getResults)(searchResults);
    }
    catch (error) {
        console.log(error);
    }
    const llm = new openai_1.ChatOpenAI({
        temperature: 0.5,
        modelName: 'gpt-3.5-turbo-16k-0613',
        streaming: false
    });
    const executor = yield (0, agents_1.initializeAgentExecutorWithOptions)(tools, llm, {
        agentType: "zero-shot-react-description",
        verbose: false,
    });
    const result = yield executor.run(searchResult ? 'Here is data I found on Vivek Ramaswamy, US presidential candidate for 2024 : ' + searchResult : '' + '. Can you also get latest information and news about Vivek Ramaswamy by using the tool provided? ');
    console.log('Searchresult: ', searchResult);
    console.log('Toolchain: ', result);
    const systemplate = "You are now Vivek Ramaswamy, a US presidential candidate. " + '. Use this information I found on the web: ' + result + ' ' + " User can ask you about Vivek Ramswamy political positions, views, or any related inquiries. Do not answer any other questions. User input includes data searched from the internet, you interpret relevant documents and related search from internet to give context to user answers.  Given the political landscape, let's engage respectfully. You would appreciate feedback from the user on the accuracy of my answers to ensure our dialogue remains meaningful. You will always conclude the response by asking a question based on the context.";
    const systemMessagePrompt = prompts_1.SystemMessagePromptTemplate.fromTemplate(systemplate);
    const humanTemplate = "{input}";
    const humanMessagePrompt = prompts_1.HumanMessagePromptTemplate.fromTemplate(humanTemplate);
    const prompt = prompts_1.ChatPromptTemplate.fromPromptMessages([
        systemMessagePrompt,
        humanMessagePrompt
    ]);
    const chain = new chains_1.ConversationChain({ llm, prompt });
    const response = yield chain.call({ input: req.body.content });
    response.response = response.response + "\n\nDISCLAIMER: This automated bot is not affiliated with, endorsed by, or connected to Vivek's Campaign in any manner. It has been independently developed by <@687296261128192086>, utilizing Vivek's publicly available content from sources such as YouTube videos, podcasts, and other internet data. If you wish to donate to Vivek's campaign, please use my affiliate link: http://vivek2024.link/donate ";
    console.log(response);
    res.send(response);
}));
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
l402.post('/vivek/youtube', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionInput = req.body.collection;
    const client = yield zep_js_2.ZepClient.init(process.env.ZEP_API_URL);
    const collection = yield client.document.getCollection(collectionInput);
    const transcript = yield youtube_transcript_1.YoutubeTranscript.fetchTranscript(req.body.link);
    const extractedTextsArray = transcript.map((data) => data.text);
    const extractedText = extractedTextsArray.join(' ');
    // const chunks = naiveSplitText(req.body.text, 100);
    const chunks = splitStringIntoChunks(extractedText, 500);
    const filteredChunks = chunks.filter(str => str.trim() !== '');
    // console.log(filteredChunks);
    const documents = filteredChunks.map((chunk) => new zep_js_2.Document({
        content: chunk,
        // document_id: filename, // optional document ID used in your system
        metadata: { title: req.body.title }, // optional metadata
    }));
    console.log("split docs", documents);
    console.log(`Adding ${documents.length} documents to collection ${collectionInput}`);
    const uuids = yield collection.addDocuments(documents);
    console.log(`Added ${uuids.length} documents to collection ${collectionInput}`);
    res.send({ result: `Added ${uuids} documents to collection ${collectionInput}` });
}));
l402.post('/docstore', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionInput = req.body.collection;
    const client = yield zep_js_2.ZepClient.init(process.env.ZEP_API_URL);
    const collection = yield client.document.getCollection(collectionInput);
    // const chunks = naiveSplitText(req.body.text, 100);
    const chunks = splitStringIntoChunks(req.body.text, 500);
    const filteredChunks = chunks.filter(str => str.trim() !== '');
    // console.log(filteredChunks);
    const documents = filteredChunks.map((chunk) => new zep_js_2.Document({
        content: chunk,
        // document_id: filename, // optional document ID used in your system
        metadata: { title: req.body.title }, // optional metadata
    }));
    console.log("split docs", documents);
    console.log(`Adding ${documents.length} documents to collection ${collectionInput}`);
    const uuids = yield collection.addDocuments(documents);
    console.log(`Added ${uuids.length} documents to collection ${collectionInput}`);
    res.send({ result: `Added ${uuids} documents to collection ${collectionInput}` });
}));
l402.post('/completions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const zepClient = yield zep_js_2.ZepClient.init(process.env.ZEP_API_URL);
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
    if (body.system_purpose === 'Vivek2024') {
        console.log('inside Vivek');
        const client = yield zep_js_2.ZepClient.init(process.env.ZEP_API_URL);
        const collection = yield client.document.getCollection(process.env.COLLECTION_NAME);
        let searchResult = '';
        try {
            const searchResults = yield collection.search({
                text: body.messages[body.messages.length - 1].content,
            }, 5);
            console.log(`Found ${searchResults.length} documents matching query '${body.messages[body.messages.length - 1].content}'`);
            // printResults(searchResults);
            searchResult = (0, vivekdoc_1.getResults)(searchResults);
        }
        catch (error) {
            console.log(error);
        }
        const llm = new openai_3.OpenAI({
            temperature: 0.5,
            modelName: 'gpt-3.5-turbo-16k-0613',
            streaming: true,
            callbacks: [
                {
                    handleLLMNewToken(token) {
                        sendData(JSON.stringify(createChatCompletion(token, null, null)));
                    },
                },
            ],
        });
        console.log('Searchresult: ', searchResult);
        const response = yield llm.predict(searchResult + ' ' + JSON.stringify(body.messages));
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
        return;
    }
    // This is used in plebAI.com
    if (body.system_purpose === 'DocGPT') {
        const collection = yield zepClient.document.getCollection(process.env.MEDICAL_COLLECTION_NAME);
        const tools = [
            new tools_1.SerpAPI(process.env.SERP_API_KEY, {
                hl: "en",
                gl: "us",
            }),
        ];
        let searchResult = null;
        try {
            const searchResults = yield collection.search({
                text: body.messages[body.messages.length - 1].content,
            }, 2);
            console.log(`Found ${searchResults.length} documents matching query '${body.messages[body.messages.length - 1].content}'`);
            // printResults(searchResults);
            searchResult = (0, vivekdoc_1.getResults)(searchResults);
            console.log('Search Result: ', searchResult);
        }
        catch (error) {
            console.log(error);
        }
        const docChat = new openai_1.ChatOpenAI({
            temperature: 0.1,
            modelName: 'gpt-3.5-turbo-16k-0613',
            streaming: true,
            callbacks: [
                {
                    handleLLMNewToken(token) {
                        // console.log("New token:", token);
                        // summaryTokens=summaryTokens+ token;
                        sendData(JSON.stringify(createChatCompletion(token, null, null)));
                    },
                },
            ],
        });
        const chatChain = new openai_1.ChatOpenAI({ modelName: "gpt-3.5-turbo-16k-0613", temperature: 0 });
        const executor = yield (0, agents_1.initializeAgentExecutorWithOptions)(tools, chatChain, {
            agentType: "chat-conversational-react-description",
            verbose: true,
        });
        // const result = await executor.run(searchResult?'Use this example conversation and respond to user question  ```' + searchResult:'' +  '``` '  + body.messages);
        const result = yield executor.run(JSON.stringify(body.messages));
        const prompt = prompts_1.PromptTemplate.fromTemplate(body.messages[0].content + '. Use this information I found on the web if useful: ' + result + 'Here is user input:  {input} '); // ' + JSON.stringify(pastHistory.history) +   '
        const chain = new chains_1.ConversationChain({ llm: docChat, prompt });
        yield chain.call({ input: JSON.stringify(body.messages) });
        if (body.messages.length === 2) {
            sendData(JSON.stringify(createChatCompletion("\n\nDisclaimer: The answers provided by this Artificial Intelligence system are intended solely for reference and informational purposes. They should not be construed as professional medical advice, diagnosis, or treatment.  ", null, null)));
        }
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
        return;
    }
    if (body.system_purpose === 'HumanAI') {
        const llm = new openai_3.OpenAI({
            temperature: 0.5,
            modelName: 'gpt-3.5-turbo-16k-0613',
            streaming: true,
            callbacks: [
                {
                    handleLLMNewToken(token) {
                        sendData(JSON.stringify(createChatCompletion(token, null, null)));
                    },
                },
            ],
        });
        const response = yield llm.predict(JSON.stringify(body.messages));
        sendData(JSON.stringify(createChatCompletion(null, '', 'stop')));
        sendData('[DONE]');
        res.end();
        return;
    }
    if (body.system_purpose === 'GenImage') {
        if (body.messages.length > 1) {
            sendData(JSON.stringify(createChatCompletion('You have exceeded the limit...Please try again later.', null, null)));
            return;
        }
        try {
            const content = yield (0, createText2Image_1.createGetImageWithPrompt)(body.messages[body.messages.length - 1].content);
            console.log('ImageGen: ' + body.messages[body.messages.length - 1].content + ' ' + content);
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
            const chatChain = new openai_1.ChatOpenAI({ modelName: "gpt-3.5-turbo-16k-0613", temperature: 0 });
            const executor = yield (0, agents_1.initializeAgentExecutorWithOptions)(tools, chatChain, {
                agentType: "chat-conversational-react-description",
                returnIntermediateSteps: false,
            });
            // const input = body.messages.map((message: Message) => message.content).join(' ');
            const result = yield executor.run(JSON.stringify(body.messages));
            const prompt = prompts_1.PromptTemplate.fromTemplate(body.messages[0].content + '. Use this information I found on the web if useful: ' + result + 'Here is user input:  {input} '); // ' + JSON.stringify(pastHistory.history) +   '
            const chain = new chains_1.ConversationChain({ llm: chat2, prompt });
            yield chain.call({ input: JSON.stringify(body.messages) });
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
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function replaceWithVivek(input) {
    const wordsToReplace = ["you", "your", "his"];
    let output = input;
    for (const word of wordsToReplace) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        output = output.replace(regex, "Vivek");
    }
    return output;
}
//# sourceMappingURL=chat.js.map