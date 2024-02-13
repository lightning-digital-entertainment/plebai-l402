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
exports.updateTable = exports.insertData = exports.getAnimateData = exports.getAgentById = void 0;
const express_1 = require("express");
const data_1 = require("../modules/data");
const pg_1 = require("pg");
const helpers_1 = require("../modules/helpers");
const dotenv = __importStar(require("dotenv"));
const uuid_1 = require("uuid");
const fs_1 = require("fs");
const promises_1 = require("timers/promises");
const txt2img_1 = require("../modules/randomseed/txt2img");
const createEmbed_1 = require("../modules/getZep/createEmbed");
const createuser_1 = require("../modules/nostr/createuser");
const data = (0, express_1.Router)();
dotenv.config();
const pubkey = (nip05) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [username, hostname] = nip05.split('@');
        const invoiceResponse = yield fetch('https://' + hostname + '/.well-known/nostr.json?name=' + encodeURIComponent(username), { method: 'GET' });
        const responseJson = yield invoiceResponse.json();
        return (responseJson === null || responseJson === void 0 ? void 0 : responseJson.names[username]) ? responseJson === null || responseJson === void 0 ? void 0 : responseJson.names[username] : '';
    }
    catch (error) {
        console.log(error);
        return '';
    }
});
const cn = {
    host: process.env.DBHOST,
    port: 5432,
    database: process.env.DBNAME,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    poolSize: 20,
    ssl: { rejectUnauthorized: false, }
};
const pgclient = new pg_1.Client(cn);
let pgupdate = false;
pgclient.connect((err) => {
    if (err) {
        console.error('pg connection error', err.stack);
        pgupdate = false;
    }
    else {
        console.log('pg client is connected');
        pgupdate = true;
    }
});
data.post('/upload', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = (0, uuid_1.v4)();
        const fileString = req.body.input;
        (0, fs_1.writeFileSync)(process.env.UPLOAD_PATH + id + `.` + req.body.type, fileString.split(",")[1], 'base64');
        if (req.body.type === 'jpeg' || req.body.type === 'png' || req.body.type === 'jpg') {
            const response = yield (0, helpers_1.getImageUrl)(id, req.body.type);
            console.log(response);
            res.send(({ 'url': response }));
        }
        else {
            console.log(process.env.UPLOAD_PATH + id + `.` + req.body.type);
            res.send(({ 'url': id + `.` + req.body.type }));
        }
    }
    catch (error) {
        res.send({ 'error': true });
    }
}));
data.post('/agents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    if (!pgupdate) {
        res.send({ SystemPurposes: data_1.SystemPurposes });
    }
    else {
        const result = yield pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, nip05, category, restricted, CASE WHEN createtime < NOW() - INTERVAL '4 day' THEN 'false' ELSE 'true' END AS newagent, datasource, req_type, iresearch FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '" + req.body.fingerPrint + "') ORDER BY CASE WHEN createdby = '" + req.body.fingerPrint + "' THEN 0 ELSE 1 END, CASE WHEN createtime >= (current_timestamp - interval '2 day') THEN 0 ELSE 1 END, chatruns DESC; ");
        // const result = await pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, category  FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '"+ req.body.fingerPrint + "') ORDER BY chatruns DESC;" );
        const agentData = [];
        const dataOutput = {};
        if (result.rows) {
            result.rows.filter((item) => __awaiter(void 0, void 0, void 0, function* () {
                // const getPubkey = await pubkey(item.nip05);
                agentData.push({
                    [item.id]: {
                        title: item.title,
                        description: item.description,
                        systemMessage: item.systemmessage,
                        symbol: item.symbol,
                        examples: item.examples,
                        placeHolder: item.placeholder,
                        chatLLM: item.chatllm,
                        llmRouter: item.llmrouter,
                        convoCount: item.convocount,
                        maxToken: item.maxtoken,
                        temperature: item.temperature,
                        satsPay: item.satspay,
                        paid: item.paid,
                        private: item.private,
                        status: item.status,
                        createdBy: item.createdby,
                        updatedBy: item.updatedby,
                        chatruns: item.chatruns,
                        newAgent: item.newagent,
                        nip05: item.nip05,
                        category: item.category,
                        restricted: item.restricted,
                        iresearch: item.iresearch,
                        reqType: item.req_type,
                        datasource: item.datasource
                    },
                });
            }));
            // console.log(agentData)   ;
            agentData.forEach(item => {
                const key = Object.keys(item)[0];
                dataOutput[key] = item[key];
            });
            res.send({ SystemPurposes: dataOutput });
        }
    }
}));
data.get('/prompts/:id/:limit/:offset', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.params);
    const result = yield pgclient.query("select message_id, agent_type, user_message, response from messages where response <> '' and agent_type = '" + req.params.id + "' order by feedback_type DESC, created_on DESC limit " + req.params.limit + " offset " + req.params.offset + ";  ");
    res.send(result.rows);
}));
data.get('/agent/name/:name', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(req.params);
    const name = decodeURIComponent(req.params.name);
    console.log(name);
    const result = yield pgclient.query("select id, title from aiagents where title = '" + name + "' ");
    if (((_a = result === null || result === void 0 ? void 0 : result.rows) === null || _a === void 0 ? void 0 : _a.length) === 0) {
        res.send({ status: false });
    }
    else {
        res.send({ status: true });
    }
}));
data.get('/models', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const getModelData = yield (0, txt2img_1.getModels)();
    res.send({ getModelData });
}));
data.post('/agents/all', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    if (!pgupdate) {
        res.send({ SystemPurposes: data_1.SystemPurposes });
    }
    else {
        const result = yield pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, CASE WHEN createtime < NOW() - INTERVAL '2 day' THEN 'false' ELSE 'true' END AS newagent, key_iv, key_content, nip05, datasource, req_type, iresearch FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '" + req.body.fingerPrint + "') ORDER BY CASE WHEN createdby = '" + req.body.fingerPrint + "' THEN 0 ELSE 1 END, CASE WHEN createtime >= (current_timestamp - interval '2 day') THEN 0 ELSE 1 END, chatruns DESC; ");
        // const result = await pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns  FROM aiagents WHERE (status = 'active' AND private = false) OR (createdby = '"+ req.body.fingerPrint + "') ORDER BY chatruns DESC;" );
        const agentData = [];
        const dataOutput = {};
        if (result.rows) {
            result.rows.filter(item => {
                agentData.push({
                    [item.id]: {
                        title: item.title,
                        description: item.description,
                        systemMessage: item.systemmessage,
                        symbol: item.symbol,
                        examples: item.examples,
                        placeHolder: item.placeholder,
                        chatLLM: item.chatllm,
                        llmRouter: item.llmrouter,
                        convoCount: item.convocount,
                        maxToken: item.maxtoken,
                        temperature: item.temperature,
                        satsPay: item.satspay,
                        paid: item.paid,
                        private: item.private,
                        status: item.status,
                        createdBy: item.createdby,
                        updatedBy: item.updatedby,
                        chatruns: item.chatruns,
                        newAgent: item.newagent,
                        key_iv: item.key_iv,
                        key_content: item.key_content,
                        nip05: item.nip05,
                        iresearch: item.iresearch,
                        reqType: item.req_type,
                        datasource: item.datasource
                    },
                });
            });
            agentData.forEach(item => {
                const key = Object.keys(item)[0];
                dataOutput[key] = item[key];
            });
            res.send({ SystemPurposes: dataOutput });
        }
    }
}));
data.post('/agent', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    console.log(req.body);
    if (!((_b = req.body) === null || _b === void 0 ? void 0 : _b.id))
        res.send({ error: 'ai agent not found' });
    if (!pgupdate) {
        res.send({ error: 'ai agent not found' });
    }
    else {
        const result = yield pgclient.query("SELECT id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, chatruns, category, commissionaddress, modelid, lora, image_height, image_width, CASE WHEN createtime < NOW() - INTERVAL '2 day' THEN 'false' ELSE 'true' END AS newagent, key_iv, key_content, nip05, datasource, req_type, iresearch FROM aiagents WHERE  id = '" + req.body.id + "'");
        const agentData = [];
        const dataOutput = {};
        if (result.rows) {
            result.rows.filter(item => {
                agentData.push({
                    [item.id]: {
                        title: item.title,
                        description: item.description,
                        systemMessage: item.systemmessage,
                        symbol: item.symbol,
                        examples: item.examples,
                        placeHolder: item.placeholder,
                        chatLLM: item.chatllm,
                        llmRouter: item.llmrouter,
                        convoCount: item.convocount,
                        maxToken: item.maxtoken,
                        temperature: item.temperature,
                        satsPay: item.satspay,
                        paid: item.paid,
                        private: item.private,
                        status: item.status,
                        createdBy: item.createdby,
                        updatedBy: item.updatedby,
                        chatruns: item.chatruns,
                        newAgent: item.newagent,
                        key_iv: item.key_iv,
                        key_content: item.key_content,
                        nip05: item.nip05,
                        category: item.category,
                        commissionAddress: item.commissionaddress,
                        modelid: item.modelid,
                        lora: item.lora,
                        image_height: item.image_height,
                        image_width: item.image_width,
                        iresearch: item.iresearch,
                        reqType: item.req_type,
                        datasource: item.datasource
                    },
                });
            });
            agentData.forEach(item => {
                const key = Object.keys(item)[0];
                dataOutput[key] = item[key];
            });
            res.send({ SystemPurposes: dataOutput });
        }
    }
}));
data.post('/agent/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const agentData = req.body;
    let count = 1;
    const ids = Object.keys(agentData)
        .filter(key => agentData.hasOwnProperty(key))
        .filter((key) => __awaiter(void 0, void 0, void 0, function* () {
        const agent = agentData[key];
        console.log(agent);
        if (!agent.paid)
            agent.paid = false;
        if (!agent.llmRouter)
            agent.llmRouter = 'nousresearch/nous-hermes-llama2-13b';
        if (!agent.convoCount)
            agent.convoCount = 5;
        if (!agent.maxToken)
            agent.maxToken = 512;
        if (!agent.temperature)
            agent.temperature = 0.8;
        if (!agent.satsPay)
            agent.satsPay = 50;
        if (!agent.commissionAddress)
            agent.commissionAddress = '';
        if (!agent.category)
            agent.category = 'Assistant';
        if (!agent.genimage)
            agent.genimage = false;
        if (!agent.modelid)
            agent.modelid = '';
        if (!agent.image_height)
            agent.image_height = 0;
        if (!agent.image_wdith)
            agent.image_wdith = 0;
        if (!agent.lora)
            agent.lora = '';
        if (!agent.reqType)
            agent.reqType = '';
        if (!agent.iresearch)
            agent.iresearch = false;
        if (!agent.datasource)
            agent.datasource = '{}';
        const nostrUser = yield (0, createuser_1.createNostrUser)(agent.title);
        const result = yield insertData("INSERT INTO aiagents (id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby, commissionaddress, category, genimage, modelid, lora, image_height, image_width, req_type, iresearch, datasource, nip05,key_iv,key_content  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)", [key, agent.title, agent.description, agent.systemMessage, agent.symbol, agent.examples, agent.placeHolder, agent.chatLLM, agent.llmRouter, agent.convoCount, agent.maxToken, agent.temperature, agent.satsPay, agent.paid, agent.private, agent.status, agent.createdBy, agent.updatedBy, agent.commissionAddress, agent.category, agent.genimage, agent.modelid, agent.lora, agent.image_height, agent.image_wdith, agent.reqType, agent.iresearch, agent.datasource, nostrUser.nip05, nostrUser.key_iv, nostrUser.key_content]);
        if (!result)
            return (0, helpers_1.errorBadAuth)(res);
        console.log(Object.keys(agentData).length, count);
        if (Object.keys(agentData).length === count)
            res.send({ result: 'Update success' });
        count++;
        if (agent.datasource)
            (0, createEmbed_1.createZepEmbeddings)(key);
    }));
}));
function getAgentById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield pgclient.query("SELECT * from aiagents where id = '" + id + "';");
        return (result.rows[0]);
    });
}
exports.getAgentById = getAgentById;
function getAnimateData(trackId) {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            const result = yield pgclient.query("SELECT * from animate_diff where track_id = '" + trackId + "';");
            if (result.rows.length > 0)
                return (result.rows[0]);
            yield (0, promises_1.setTimeout)(1000);
        }
    });
}
exports.getAnimateData = getAnimateData;
data.post('/agent/update', (req, res) => {
    console.log(req.body);
    const columns = Object.keys(req.body);
    const values = Object.values(req.body);
    const updateQuery = `UPDATE aiagents SET ${columns.map((column, index) => `${column} = $${index + 1}`).join(', ')} WHERE id = '` + req.body.id + `'`;
    console.log(updateQuery, values);
    pgclient.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error updating table');
        }
        else {
            console.log(result);
            res.send(result);
        }
    });
    (0, createEmbed_1.createZepEmbeddings)(req.body.id);
});
data.post('/genimage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const body = req.body;
    yield insertData("INSERT INTO messages (message_id, conversation_id, fingerprint_id, llmrouter, agent_type, user_message, response, chat_history, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [body.messageId, body.conversationId, body.app_fingerprint, body.llm_router, body.agent_type, body.prompt, body.response, req.body, req.body]);
    const response = { status: 'all good' };
    res.send(response);
}));
data.post('/feedback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    yield insertData('UPDATE messages SET feedback_type = $1 where message_id = $2', [req.body.feedback_type, req.body.message_id]);
    const response = { status: 'all good' };
    res.send(response);
}));
exports.default = data;
function insertData(insertQuery, insertValues) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!pgupdate)
                return false;
            yield pgclient.query('BEGIN');
            const insertDataQuery = insertQuery;
            const insertDataValues = insertValues;
            console.log(insertDataQuery, insertDataValues);
            yield pgclient.query(insertDataQuery, insertDataValues);
            yield pgclient.query('COMMIT');
            console.log('table updated');
            return true;
        }
        catch (e) {
            yield pgclient.query('ROLLBACK');
            console.log(e);
            return false;
        }
    });
}
exports.insertData = insertData;
function updateTable(body) {
    return __awaiter(this, void 0, void 0, function* () {
        const columns = Object.keys(body);
        const values = Object.values(body);
        const updateQuery = `UPDATE aiagents SET ${columns.map((column, index) => `${column} = $${index + 1}`).join(', ')} WHERE id = '` + body.id + `'`;
        console.log(updateQuery, values);
        pgclient.query(updateQuery, values, (err, result) => {
            if (err) {
                console.error(err);
                return false;
            }
            else {
                console.log(result);
                return true;
            }
        });
        return false;
    });
}
exports.updateTable = updateTable;
//# sourceMappingURL=data.js.map