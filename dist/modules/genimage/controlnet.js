"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapControlNetOptions = exports.Preprocessor = exports.ResizeMode = void 0;
var ResizeMode;
(function (ResizeMode) {
    ResizeMode["Envelope"] = "Envelope (Outer Fit)";
    ResizeMode["ScaleToFit"] = "Scale to Fit (Inner Fit)";
    ResizeMode["JustResize"] = "Just Resize";
})(ResizeMode || (exports.ResizeMode = ResizeMode = {}));
var Preprocessor;
(function (Preprocessor) {
    Preprocessor["None"] = "none";
    Preprocessor["Canny"] = "canny";
    Preprocessor["Depth"] = "depth";
    Preprocessor["Depth_LeRes"] = "depth_leres";
    Preprocessor["HED"] = "hed";
    Preprocessor["MLSD"] = "mlsd";
    Preprocessor["NormalMap"] = "normal_map";
    Preprocessor["OpenPose"] = "openpose";
    Preprocessor["Pidinet"] = "pidinet";
    Preprocessor["Scribble"] = "scribble";
    Preprocessor["Fake_Scribble"] = "fake_scribble";
    Preprocessor["Segmentation"] = "segmentation";
})(Preprocessor || (exports.Preprocessor = Preprocessor = {}));
const mapControlNetOptions = (options) => {
    const body = {
        module: options.preprocessor || Preprocessor.None,
        model: options.model || 'None',
        weight: options.weight || 1,
        guidance_start: options.guidanceStart || 0,
        guidance_end: options.guidanceEnd || 1,
        resize_mode: options.resizeMode || ResizeMode.ScaleToFit,
        guess_mode: options.guessMode || false,
        lowvram: options.lowvram || false,
    };
    if (options.inputImageData) {
        body.input_image = options.inputImageData;
    }
    if (options.mask) {
        body.mask = options.mask;
    }
    return body;
};
exports.mapControlNetOptions = mapControlNetOptions;
//# sourceMappingURL=controlnet.js.map