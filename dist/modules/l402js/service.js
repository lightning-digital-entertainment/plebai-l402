"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeCapabilitiesValue = exports.createNewCapabilitiesCaveat = exports.SERVICE_CAPABILITIES_SUFFIX = exports.encodeServicesCaveatValue = exports.decodeServicesCaveat = exports.SERVICES_CAVEAT_CONDITION = exports.Service = exports.InvalidCapabilitiesError = exports.InvalidServicesError = exports.NoServicesError = void 0;
/**
 * @file Services are a special kind of caveat based off of
 * the official lsat spec by
 * [Lightning Labs](https://lsat.tech/macaroons#target-services).
 * These have certain expectations around value encoding and also support
 * tiers of capabilities where services have service level capabilities and
 * capabilities in turn can have constraints.
 * See below for an example from lightning loop.
 *
 * @example
 *  services = lightning_loop:0
 *  lightning_loop_capabilities = loop_out,loop_in
 *  loop_out_monthly_volume_sats = 200000000
 *
 */
/* tslint:disable:max-classes-per-file */
const bufio_1 = __importDefault(require("bufio"));
const caveat_1 = require("./caveat");
class NoServicesError extends Error {
    constructor(...params) {
        super(...params);
        this.name = 'NoServicesError';
        this.message = 'no services found';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NoServicesError);
        }
    }
}
exports.NoServicesError = NoServicesError;
class InvalidServicesError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidServicesError';
        if (!message)
            this.message = 'service must be of the form "name:tier"';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidServicesError);
        }
    }
}
exports.InvalidServicesError = InvalidServicesError;
class InvalidCapabilitiesError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidCapabilitiesError';
        if (!message)
            this.message = 'capabilities must be a string or array of strings';
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidServicesError);
        }
    }
}
exports.InvalidCapabilitiesError = InvalidCapabilitiesError;
class Service extends bufio_1.default.Struct {
    constructor(options) {
        super(options);
        this.name = options.name;
        this.tier = options.tier;
    }
}
exports.Service = Service;
// the condition value in a caveat for services
exports.SERVICES_CAVEAT_CONDITION = 'services';
/**
 *
 * @param {string} s - raw services string of format `name:tier,name:tier`
 * @returns array of Service objects or throws an error
 */
const decodeServicesCaveat = (s) => {
    if (!s.length)
        throw new NoServicesError();
    const services = [];
    const rawServices = s.split(',');
    for (const serviceString of rawServices) {
        const [service, tier] = serviceString.split(':');
        // validation
        if (!service || !tier)
            throw new InvalidServicesError();
        if (isNaN(+tier))
            throw new InvalidServicesError('tier must be a number');
        if (!isNaN(+service))
            throw new InvalidServicesError('service name must be a string');
        services.push(new Service({ name: service, tier: +tier }));
    }
    return services;
};
exports.decodeServicesCaveat = decodeServicesCaveat;
const encodeServicesCaveatValue = (services) => {
    if (!services.length)
        throw new NoServicesError();
    let rawServices = '';
    for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if (!(service instanceof Service))
            throw new InvalidServicesError('not a valid service');
        if (!service.name)
            throw new InvalidServicesError('service must nave a name');
        if (service.tier !== 0 && !service.tier)
            throw new InvalidServicesError('service must have a tier');
        rawServices = rawServices.concat(`${service.name}:${service.tier}`);
        // add a comma at the end if it's not the same
        if (i !== services.length - 1)
            rawServices = `${rawServices},`;
    }
    return rawServices;
};
exports.encodeServicesCaveatValue = encodeServicesCaveatValue;
exports.SERVICE_CAPABILITIES_SUFFIX = '_capabilities';
const createNewCapabilitiesCaveat = (serviceName, _capabilities) => {
    let capabilities;
    if (!_capabilities) {
        capabilities = '';
    }
    else if (Array.isArray(_capabilities)) {
        capabilities = _capabilities.join(',');
    }
    else if (typeof _capabilities !== 'string') {
        throw new InvalidCapabilitiesError();
    }
    else {
        capabilities = _capabilities;
    }
    return new caveat_1.Caveat({
        condition: serviceName + exports.SERVICE_CAPABILITIES_SUFFIX,
        value: capabilities,
        comp: '=',
    });
};
exports.createNewCapabilitiesCaveat = createNewCapabilitiesCaveat;
const decodeCapabilitiesValue = (value) => {
    if (typeof value !== 'string')
        throw new InvalidCapabilitiesError();
    return value
        .toString()
        .split(',')
        .map((s) => s.trim());
};
exports.decodeCapabilitiesValue = decodeCapabilitiesValue;
//# sourceMappingURL=service.js.map