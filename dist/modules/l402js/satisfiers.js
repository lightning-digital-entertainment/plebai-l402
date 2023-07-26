"use strict";
/**
 * @file Useful satisfiers that are independent of environment, for example,
 * ones that don't require the request object in a server as these can be used anywhere.
 */
/* tslint:disable:no-shadowed-variable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCapabilitiesSatisfier = exports.createServicesSatisfier = exports.expirationSatisfier = void 0;
const _1 = require(".");
/**
 * @description A satisfier for validating expiration caveats on macaroon. Used in the exported
 * boltwallConfig TIME_CAVEAT_CONFIGS
 * @type Satisfier
 */
exports.expirationSatisfier = {
    condition: 'expiration',
    satisfyPrevious: (prev, curr) => {
        if (prev.condition !== 'expiration' || curr.condition !== 'expiration')
            return false;
        // fails if current expiration is later than previous
        // (i.e. newer caveats should be more restrictive)
        else if (prev.value < curr.value)
            return false;
        else
            return true;
    },
    satisfyFinal: (caveat) => {
        if (caveat.condition !== 'expiration')
            return false;
        // if the expiration value is less than current time than satisfier is failed
        if (caveat.value < Date.now())
            return false;
        return true;
    },
};
const createServicesSatisfier = (targetService) => {
    // validate targetService
    if (typeof targetService !== 'string')
        throw new _1.InvalidServicesError();
    return {
        condition: _1.SERVICES_CAVEAT_CONDITION,
        satisfyPrevious: (prev, curr) => {
            const prevServices = (0, _1.decodeServicesCaveat)(prev.value.toString());
            const currentServices = (0, _1.decodeServicesCaveat)(curr.value.toString());
            // making typescript happy
            if (!Array.isArray(prevServices) || !Array.isArray(currentServices))
                throw new _1.InvalidServicesError();
            // Construct a set of the services we were previously
            // allowed to access.
            let previouslyAllowed = new Map();
            previouslyAllowed = prevServices.reduce((prev, current) => prev.set(current.name, current.tier), previouslyAllowed);
            // The caveat should not include any new services that
            // weren't previously allowed.
            for (const service of currentServices) {
                if (!previouslyAllowed.has(service.name))
                    return false;
                // confirm that previous service tier cannot be higher than current
                const prevTier = previouslyAllowed.get(service.name);
                if (prevTier > service.tier)
                    return false;
            }
            return true;
        },
        satisfyFinal: (caveat) => {
            const services = (0, _1.decodeServicesCaveat)(caveat.value.toString());
            // making typescript happy
            if (!Array.isArray(services))
                throw new _1.InvalidServicesError();
            for (const service of services) {
                if (service.name === targetService)
                    return true;
            }
            return false;
        },
    };
};
exports.createServicesSatisfier = createServicesSatisfier;
const createCapabilitiesSatisfier = (service, targetCapability) => {
    // validate targetService
    if (typeof targetCapability !== 'string')
        throw new _1.InvalidCapabilitiesError();
    if (typeof service !== 'string')
        throw new _1.InvalidCapabilitiesError();
    return {
        condition: service + _1.SERVICE_CAPABILITIES_SUFFIX,
        satisfyPrevious: (prev, curr) => {
            const prevCapabilities = (0, _1.decodeCapabilitiesValue)(prev.value.toString());
            const currentCapabilities = (0, _1.decodeCapabilitiesValue)(curr.value.toString());
            // making typescript happy
            if (!Array.isArray(prevCapabilities) ||
                !Array.isArray(currentCapabilities))
                throw new _1.InvalidServicesError();
            // Construct a set of the service's capabilities we were
            // previously allowed to access.
            let previouslyAllowed = new Set();
            previouslyAllowed = prevCapabilities.reduce((prev, current) => prev.add(current), previouslyAllowed);
            // The caveat should not include any new service
            // capabilities that weren't previously allowed.
            for (const capability of currentCapabilities) {
                if (!previouslyAllowed.has(capability))
                    return false;
            }
            return true;
        },
        satisfyFinal: (caveat) => {
            const capabilities = (0, _1.decodeCapabilitiesValue)(caveat.value.toString());
            // making typescript happy
            if (!Array.isArray(capabilities))
                throw new _1.InvalidServicesError();
            for (const capability of capabilities) {
                if (capability === targetCapability)
                    return true;
            }
            return false;
        },
    };
};
exports.createCapabilitiesSatisfier = createCapabilitiesSatisfier;
//# sourceMappingURL=satisfiers.js.map