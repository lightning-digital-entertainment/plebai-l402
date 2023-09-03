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
exports.getResults = exports.printResults = exports.naiveSplitText = exports.readChunkFromFile = void 0;
const fs = __importStar(require("fs"));
const zep_js_1 = require("@getzep/zep-js");
const readline = __importStar(require("readline"));
const zepApiUrl = "http://107.21.5.87:7999";
const collectionName = 'medical202301';
function createCollection() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Creating collection ${collectionName}`);
        const client = yield zep_js_1.ZepClient.init(zepApiUrl);
        const collection = yield client.document.addCollection({
            name: collectionName,
            embeddingDimensions: 1536,
            description: "vivek2024 campaign",
            metadata: { 'title': 'Vivek interview Youtube transacript' },
            isAutoEmbedded: true, // optional (default: true) - whether Zep should  automatically embed documents
        });
        console.log(collection);
    });
}
function uploadDocumentsOld() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield zep_js_1.ZepClient.init(zepApiUrl);
        const collection = yield client.document.getCollection(collectionName);
        const filename = '/Users/arunnedunchezian/Downloads/medical\ datasets/cleaned_chatdoctor_text_updated.txt';
        console.log('File name is: ', filename);
        // const chunks = readChunkFromFile(filePath, maxChunk);
        const text = fs.readFileSync(filename, "utf8");
        const chunks = splitStringIntoChunks(text, 800);
        const filteredChunks = chunks.filter(str => str.trim() !== '');
        console.log(filteredChunks);
        const documents = filteredChunks.map((chunk) => new zep_js_1.Document({
            content: chunk,
            // document_id: filename, // optional document ID used in your system
            metadata: { title: filename }, // optional metadata
        }));
        console.log(`Adding ${documents.length} documents to collection ${collectionName}`);
        const uuids = yield collection.addDocuments(documents);
        console.log(`Added ${uuids.length} documents to collection ${collectionName}`);
        yield checkEmbeddingStatus(client, collectionName);
        // Index the collection
        console.log(`Indexing collection ${collectionName}`);
        yield collection.createIndex(true);
    });
}
function deleteDocumentsNotEmbedded() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield zep_js_1.ZepClient.init(zepApiUrl);
        const collection = yield client.document.getCollection(collectionName);
        const fetchDocuments = (uuids) => __awaiter(this, void 0, void 0, function* () {
            const documents = yield collection.getDocuments(uuids); // Replace with actual API call
            return documents;
        });
        try {
            const uuids = ['uuid1', 'uuid2', 'uuid3'];
            const documents = yield fetchDocuments(uuids);
            for (const document of documents) {
                // Process each document here
            }
        }
        catch (error) {
            console.log(error);
        }
    });
}
function deleteCollection() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`deleting collection ${collectionName}`);
        const client = yield zep_js_1.ZepClient.init(zepApiUrl);
        const collection = yield client.document.deleteCollection(collectionName);
        console.log(collection);
    });
}
function uploadDocuments() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield zep_js_1.ZepClient.init(zepApiUrl);
        const collection = yield client.document.getCollection(collectionName);
        const filename = '/Users/arunnedunchezian/Downloads/medical\ datasets/drung_info4-500.txt';
        const filteredChunks = [];
        const readStream = fs.createReadStream(filename);
        const rl = readline.createInterface({
            input: readStream,
            output: process.stdout,
            terminal: false
        });
        rl.on('line', (line) => {
            console.log(line);
            filteredChunks.push(line);
        });
        rl.on('close', () => __awaiter(this, void 0, void 0, function* () {
            console.log('Finished reading the file.');
            const documents = filteredChunks.map((chunk) => new zep_js_1.Document({
                content: chunk,
                // document_id: filename, // optional document ID used in your system
                metadata: { title: 'Drug names and their side effects' }, // optional metadata
            }));
            console.log(`Adding ${documents.length} documents to collection ${collectionName}`);
            const uuids = yield collection.addDocuments(documents);
            console.log(`Added ${uuids.length} documents to collection ${collectionName}`);
        }));
        yield checkEmbeddingStatus(client, collectionName);
        // Index the collection
        console.log(`Indexing collection ${collectionName}`);
        yield collection.createIndex(true);
    });
}
function checkStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield zep_js_1.ZepClient.init(zepApiUrl);
        yield checkEmbeddingStatus(client, collectionName);
        const collection = yield client.document.getCollection(collectionName);
        // Index the collection
        console.log(`Indexing collection ${collectionName}`);
        yield collection.createIndex(true);
    });
}
function queryDocs() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield zep_js_1.ZepClient.init(zepApiUrl);
        const collection = yield client.document.getCollection(collectionName);
        const query = "canagliflozin ";
        const searchResults = yield collection.search({
            text: query,
        }, 3);
        console.log(`Found ${searchResults.length} documents matching query '${query}'`);
        printResults(searchResults);
        const newSearchResults = yield collection.search({
            text: query
        }, 3);
        console.log(`Found ${newSearchResults.length} documents matching query '${query}'`);
        printResults(newSearchResults);
    });
}
// getYttranscripts();
// deleteCollection();
// createCollection();
uploadDocumentsOld();
// checkStatus();
// queryDocs();
function saveTextToFile(filename, text) {
    fs.writeFile(filename, text, (err) => {
        if (err) {
            console.error("Error writing to file:", err);
        }
        else {
            console.log(`Text saved to ${filename}`);
        }
    });
}
function readChunkFromFile(file, chunkSize) {
    const text = fs.readFileSync(file, "utf8");
    const chunks = naiveSplitText(text, chunkSize);
    console.log(`Splitting text into ${chunks.length} chunks of max size ${chunkSize} characters.`);
    return chunks;
}
exports.readChunkFromFile = readChunkFromFile;
function naiveSplitText(text, maxChunkSize) {
    // Naive text splitter chunks document into chunks of maxChunkSize,
    // using paragraphs and sentences as guides.
    const chunks = [];
    // Remove extraneous whitespace
    text = text.split(/\s+/).join(" ");
    // Split into paragraphs
    let paragraphs = text.split("\n\n");
    // Clean up paragraphs
    paragraphs = paragraphs.map((p) => p.trim()).filter((p) => p.length > 0);
    for (const paragraph of paragraphs) {
        if (paragraph.length > 0 && paragraph.length <= maxChunkSize) {
            chunks.push(paragraph);
        }
        else {
            const sentences = paragraph.split(". ");
            let currentChunk = "";
            for (const sentence of sentences) {
                if (currentChunk.length + sentence.length > maxChunkSize) {
                    chunks.push(currentChunk);
                    currentChunk = sentence;
                }
                else {
                    currentChunk += (currentChunk ? ". " : "") + sentence;
                }
            }
            if (currentChunk) {
                chunks.push(currentChunk);
            }
        }
    }
    return chunks;
}
exports.naiveSplitText = naiveSplitText;
function checkEmbeddingStatus(client, collectionName2) {
    return __awaiter(this, void 0, void 0, function* () {
        let c = yield client.document.getCollection(collectionName2);
        while (c.status !== "ready") {
            console.log(`Embedding status: ${c.document_embedded_count}/${c.document_count} documents embedded`);
            // Wait for 1 second
            yield new Promise((resolve) => setTimeout(resolve, 1000));
            // Fetch the collection again to get the updated status
            c = yield client.document.getCollection(collectionName2);
        }
    });
}
function printResults(results) {
    for (const result of results) {
        console.log(`${result.content} - ${JSON.stringify(result.metadata)} -> ${result.score}\n`);
    }
}
exports.printResults = printResults;
function getResults(results) {
    let data = '';
    for (const result of results) {
        data = data + " " + result.content;
    }
    return data;
}
exports.getResults = getResults;
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
//# sourceMappingURL=medical.js.map