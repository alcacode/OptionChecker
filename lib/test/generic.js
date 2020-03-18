"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConfig = {
    basic: {
        description: 'Basic',
        arg: 'abc',
        decl: { type: 'any' }
    },
    missing: {
        description: 'Optional missing',
        shouldFail: true,
        decl: { type: 'any' }
    },
    missingRequired: {
        description: 'Required missing',
        shouldFail: true,
        shouldThrow: true,
        decl: { type: 'any', required: true }
    }
};
