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
const controlnet_1 = require("./controlnet");
const mapTxt2ImgOptions = (options) => {
    let body = {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt,
        seed: options.seed,
        subseed: options.variationSeed,
        subseed_strength: options.variationSeedStrength,
        sampler_name: options.samplingMethod,
        batch_size: options.batchSize,
        n_iter: options.batchCount,
        steps: options.steps,
        width: options.width,
        height: options.height,
        cfg_scale: options.cfgScale,
        seed_resize_from_w: options.resizeSeedFromWidth,
        seed_resize_from_h: options.resizeSeedFromHeight,
        restore_faces: options.restoreFaces,
    };
    if (options.hires) {
        body = Object.assign(Object.assign({}, body), { enable_hr: true, denoising_strength: options.hires.denoisingStrength, hr_upscaler: options.hires.upscaler, hr_scale: options.hires.upscaleBy, hr_resize_x: options.hires.resizeWidthTo, hr_resize_y: options.hires.resizeHeigthTo, hr_second_pass_steps: options.hires.steps });
    }
    if (options.script) {
        body = Object.assign(Object.assign({}, body), { script_name: options.script.name, script_args: options.script.args || [] });
    }
    const { extensions } = options;
    if (extensions === null || extensions === void 0 ? void 0 : extensions.controlNet) {
        body.controlnet_units = extensions.controlNet.map(controlnet_1.mapControlNetOptions);
    }
    return body;
};
const txt2img = (options, apiUrl = process.env.TXT2IMG_URL) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const body = mapTxt2ImgOptions(options);
    let endpoint = '/sdapi/v1/txt2img';
    if ((_a = options.extensions) === null || _a === void 0 ? void 0 : _a.controlNet) {
        endpoint = '/controlnet/txt2img';
    }
    /* @ts-ignore */
    console.log(`${apiUrl}${endpoint}`);
    const result = yield fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (result.status !== 200) {
        throw new Error(result.statusText);
    }
    const data = yield result.json();
    if (!(data === null || data === void 0 ? void 0 : data.images)) {
        throw new Error('api returned an invalid response');
    }
    return data;
});
exports.txt2img = txt2img;
//# sourceMappingURL=txt2img.js.map