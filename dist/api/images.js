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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sdwebui_1 = __importDefault(require("../modules/sdwebui"));
const types_1 = require("../modules/types");
const fs_1 = require("fs");
const dotenv = __importStar(require("dotenv"));
const express_1 = require("express");
const form_data_1 = __importDefault(require("form-data"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const helpers_1 = require("../modules/helpers");
dotenv.config();
const imgGen = (0, express_1.Router)();
imgGen.post('/generations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = (0, sdwebui_1.default)();
    const id = (0, uuid_1.v4)();
    try {
        const { images } = yield client.txt2img({
            prompt: req.body.prompt ? req.body.prompt : 'Photo of a classic red mustang car parked in las vegas strip at night',
            negativePrompt: '(NSFW, Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, (Chinese, deformed, distorted, disfigured:1.3), poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, (mutated hands and fingers:1.4), disconnected limbs, mutation, mutated, ugly, disgusting, blurry, amputation, CyberRealistic_Negative-neg, ',
            samplingMethod: types_1.SamplingMethod.DPMPlusPlus_2M_Karras,
            width: 512,
            height: 512,
            steps: 20,
            batchSize: 1,
            seed: (0, helpers_1.generateRandom10DigitNumber)(),
            restoreFaces: true,
        });
        images.forEach((image, i) => (0, fs_1.writeFileSync)(process.env.UPLOAD_PATH + id + `.png`, images[0], 'base64'));
        const response = {
            "created": Date.now,
            "data": [
                {
                    "url": yield getImageUrl('data:image/png;base64,' + images[0], id)
                }
            ]
        };
        res.setHeader('Content-Type', 'application/json').status(200).send(response);
    }
    catch (err) {
        console.error(err);
        res.setHeader('Content-Type', 'application/json').status(200).send({ error: 'There is an internal server error. Please try again later' });
    }
}));
function getImageUrl(imageData, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const form = new form_data_1.default();
        form.append('asset', (0, fs_1.createReadStream)(process.env.UPLOAD_PATH + id + `.png`));
        form.append("name", 'current/plebai/genimg/' + id + `.png`);
        form.append("type", "image");
        const config = {
            method: 'post',
            url: process.env.UPLOAD_URL,
            headers: Object.assign({ 'Authorization': 'Bearer ' + process.env.UPLOAD_AUTH, 'Content-Type': 'multipart/form-data' }, form.getHeaders()),
            data: form
        };
        const resp = yield axios_1.default.request(config);
        return resp.data.data;
    });
}
exports.default = imgGen;
//# sourceMappingURL=images.js.map