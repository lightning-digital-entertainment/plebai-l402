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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTogetherAIImageWithPrompt = void 0;
const helpers_1 = require("../helpers");
const output_parsers_1 = require("langchain/output_parsers");
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const parser = output_parsers_1.StructuredOutputParser.fromNamesAndDescriptions({
    prompt: "output prompt enhanced for image generation",
    model_id: "id field given from the input prompt",
    width: "width of the image. valid range is 128 to 896",
    height: "height of the image. valid range is 128 to 896",
});
function createTogetherAIImageWithPrompt(prompt, model, height, width) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = (0, uuid_1.v4)();
        const outputFormat = "jpg";
        const data = {
            model,
            prompt,
            request_type: "image-model-inference",
            width: width ? width : 512,
            height: height ? height : 512,
            steps: 50,
            update_at: getFormattedTimestamp(),
            seed: (0, helpers_1.generateRandom5DigitNumber)(),
            n: 1,
            // image_base64: imageUrl
        };
        const togetherAIResponse = yield makeTogetherAIRequest(data);
        console.log('Together Response: ', togetherAIResponse);
        if (togetherAIResponse.output.choices[0]) {
            (0, fs_1.writeFileSync)(process.env.UPLOAD_PATH + id + `.` + outputFormat, togetherAIResponse.output.choices[0].image_base64, 'base64');
            const imageUrl = yield (0, helpers_1.getImageUrl)(id, outputFormat);
            console.log('Image URL: ', imageUrl);
            return imageUrl;
        }
        else {
            return '';
        }
    });
}
exports.createTogetherAIImageWithPrompt = createTogetherAIImageWithPrompt;
function makeTogetherAIRequest(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = process.env.TGAI_URL;
        const headers = {
            Authorization: process.env.TGAI_API
        };
        try {
            const response = yield axios_1.default.post(url, data, { headers });
            return response.data;
        }
        catch (error) {
            console.error('Error making request:', error);
            throw error;
        }
    });
}
function getFormattedTimestamp() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(now.getUTCMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}
//# sourceMappingURL=createimage.js.map