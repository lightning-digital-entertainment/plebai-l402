"use strict";
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
const serpapi_1 = require("serpapi");
const youtube_transcript_1 = require("youtube-transcript");
const prompts_1 = require("langchain/prompts");
const chains_1 = require("langchain/chains");
const tools_1 = require("langchain/tools");
const helpers_1 = require("../modules/helpers");
const agents_1 = require("langchain/agents");
const webbrowser_1 = require("langchain/tools/webbrowser");
const openai_2 = require("langchain/embeddings/openai");
const zep_js_1 = require("@getzep/zep-js");
const vivekdoc_1 = require("../vivekdoc");
require("websocket-polyfill");
const data_1 = require("../modules/data");
const l402 = (0, express_1.Router)();
l402.post('/medical2023', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside medical2023');
    const client = yield zep_js_1.ZepClient.init(process.env.ZEP_API_URL);
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
l402.post('/formula1', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside formula 1');
    const tools = [
        new tools_1.SerpAPI(process.env.SERP_API_KEY, {
            hl: "en",
            gl: "us",
        }),
    ];
    const searchQuery = 'What is the latest news on Vivek Ramaswamy';
    console.log(searchQuery);
    console.log(data_1.SystemPurposes);
    const params = {
        q: searchQuery,
        cc: "US",
        api_key: process.env.SERP_API_KEY
    };
    const serpResponse = yield (0, serpapi_1.getJson)("bing", params);
    console.log(serpResponse);
    const model = new openai_1.ChatOpenAI({
        temperature: 0.5,
        modelName: 'gpt-3.5-turbo-16k-0613',
        streaming: false
    });
    const search = new tools_1.SerpAPI(process.env.SERP_API_KEY, {
        hl: "en",
        gl: "us",
    });
    const embeddings = new openai_2.OpenAIEmbeddings();
    const browser = new webbrowser_1.WebBrowser({ model, embeddings });
    const output = yield browser.call(serpResponse.organic_results[0].link + ", " + searchQuery);
    res.send(output);
}));
l402.post('/vivek2024', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('inside Vivek2024');
    const tools = [
        new tools_1.SerpAPI(process.env.SERP_API_KEY, {
            hl: "en",
            gl: "us",
        }),
    ];
    let zepClient;
    zepClient = yield zep_js_1.ZepClient.init(process.env.ZEP_API_URL, process.env.ZEP_API_KEY)
        .then(resolvedClient => {
        zepClient = resolvedClient;
        console.log('Connected to Zep...');
    })
        .catch(error => {
        console.log('Error connecting to Zep');
    });
    const collection = yield zepClient.document.getCollection(process.env.COLLECTION_NAME);
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
    const client = yield zep_js_1.ZepClient.init(process.env.ZEP_API_URL);
    const collection = yield client.document.getCollection(collectionInput);
    const transcript = yield youtube_transcript_1.YoutubeTranscript.fetchTranscript(req.body.link);
    const extractedTextsArray = transcript.map((data) => data.text);
    const extractedText = extractedTextsArray.join(' ');
    // const chunks = naiveSplitText(req.body.text, 100);
    const chunks = splitStringIntoChunks(extractedText, 500);
    const filteredChunks = chunks.filter(str => str.trim() !== '');
    // console.log(filteredChunks);
    const documents = filteredChunks.map((chunk) => new zep_js_1.Document({
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
    const client = yield zep_js_1.ZepClient.init(process.env.ZEP_API_URL);
    const collection = yield client.document.getCollection(collectionInput);
    // const chunks = naiveSplitText(req.body.text, 100);
    const chunks = splitStringIntoChunks(req.body.text, 500);
    const filteredChunks = chunks.filter(str => str.trim() !== '');
    // console.log(filteredChunks);
    const documents = filteredChunks.map((chunk) => new zep_js_1.Document({
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
function replaceWithVivek(input) {
    const wordsToReplace = ["you", "your", "his"];
    let output = input;
    for (const word of wordsToReplace) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        output = output.replace(regex, "Vivek");
    }
    return output;
}
exports.default = l402;
//# sourceMappingURL=send.js.map