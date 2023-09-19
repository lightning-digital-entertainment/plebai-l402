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
exports.txt2img = void 0;
const mapTxt2ImgOptions = (options) => {
    const body = {
        "model": options.model,
        "prompt": options.prompt,
        "negative_prompt": options.negative_prompt,
        "width": options.width,
        "height": options.height,
        "steps": options.steps,
        "guidance": options.guidance,
        "seed": options.seed,
        "scheduler": options.scheduler,
        "output_format": options.output_format
    };
    return body;
};
const txt2img = (options, apiUrl = process.env.GETIMG_URL) => __awaiter(void 0, void 0, void 0, function* () {
    const body = mapTxt2ImgOptions(options);
    const endpoint = '/stable-diffusion/text-to-image';
    console.log(body);
    const result = yield fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.GETIMG_ACCESS_TOKEN
        },
    });
    if (result.status !== 200) {
        throw new Error(result.statusText);
    }
    const data = yield result.json();
    if (!(data === null || data === void 0 ? void 0 : data.image)) {
        throw new Error('api returned an invalid response');
    }
    return data;
});
exports.txt2img = txt2img;
//# sourceMappingURL=text-to-image.js.map