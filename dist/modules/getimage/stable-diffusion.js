"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const text_to_image_1 = require("./text-to-image");
const stabledifusion = (props) => {
    const apiUrl = (props === null || props === void 0 ? void 0 : props.apiUrl) || process.env.GETIMG_URL;
    return {
        apiUrl,
        txt2img: (options) => (0, text_to_image_1.txt2img)(options, apiUrl),
    };
};
exports.default = stabledifusion;
//# sourceMappingURL=stable-diffusion.js.map