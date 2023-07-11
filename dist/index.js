"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const path_1 = __importDefault(require("path"));
const port = process.env.PORT || 5001;
app_1.app.listen(port, () => {
    // eslint-disable no-console
    console.log(`Listening: http://localhost:${port}`);
});
// Configure Express to use EJS
app_1.app.set("views", path_1.default.join(__dirname, "views"));
app_1.app.set("view engine", "ejs");
//# sourceMappingURL=index.js.map