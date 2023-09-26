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
exports.insertData = void 0;
const express_1 = require("express");
const data_1 = require("../modules/data");
const pg_1 = require("pg");
const helpers_1 = require("../modules/helpers");
const dotenv = __importStar(require("dotenv"));
const data = (0, express_1.Router)();
dotenv.config();
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
data.post('/agents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    if (!pgupdate) {
        res.send({ SystemPurposes: data_1.SystemPurposes });
    }
    else {
        const result = yield pgclient.query("select id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby from aiagents limit 25;");
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
        const result = yield insertData("INSERT INTO aiagents (id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)", [key, agent.title, agent.description, agent.systemMessage, agent.symbol, agent.examples, agent.placeHolder, agent.chatLLM, agent.llmRouter, agent.convoCount, agent.maxToken, agent.temperature, agent.satsPay, agent.paid, agent.private, agent.status, agent.createdBy, agent.updatedBy]);
        if (!result)
            return (0, helpers_1.errorBadAuth)(res);
        console.log(Object.keys(agentData).length, count);
        if (Object.keys(agentData).length === count)
            res.send({ result: 'Update success' });
        count++;
    }));
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
//# sourceMappingURL=data.js.map