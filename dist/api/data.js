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
const data_1 = require("../modules/data");
const pg_1 = require("pg");
const data = (0, express_1.Router)();
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
        console.log('Getting data from DB');
        const result = yield pgclient.query("select mention, zaps, reposts, likes, dm, status, lntxn from pushnotify where pubkey = '" + "' and pushtoken = '" + "';");
        res.send(result.rows);
    }
}));
data.post('/agent/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const agentData = req.body;
    const ids = Object.keys(agentData)
        .filter(key => agentData.hasOwnProperty(key))
        .filter(key => {
        console.log(key);
        const purpose = agentData[key];
        console.log(purpose);
    });
    /*
    for (const count in agentData) {

            const agent = agentData[count];
           // await insertData("INSERT INTO aiagents (id, title, description, systemmessage, symbol, examples, placeholder, chatllm, llmrouter, convocount, maxtoken, temperature, satspay, paid, private, status, createdby, updatedby) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)",
           console.log(agent);


    } */
}));
function insertData(insertQuery, insertValues) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield pgclient.query('BEGIN');
            const insertDataQuery = insertQuery;
            const insertDataValues = insertValues;
            yield pgclient.query(insertDataQuery, insertDataValues);
            yield pgclient.query('COMMIT');
            console.log('invoice table updated');
        }
        catch (e) {
            yield pgclient.query('ROLLBACK');
            console.log(e);
        }
    });
}
exports.default = data;
//# sourceMappingURL=data.js.map