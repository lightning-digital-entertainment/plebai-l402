"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-console
const express_1 = require("express");
const emojis_1 = __importDefault(require("./emojis"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.json({
        message: 'API - 👋🌎🌍🌏',
    });
});
router.use('/emojis', emojis_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map