"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emojis = (0, express_1.Router)();
emojis.get('/', (req, res) => {
    res.json(['😀', '😳', '🙄']);
});
exports.default = emojis;
//# sourceMappingURL=emojis.js.map