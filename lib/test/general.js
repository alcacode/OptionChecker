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
    },
    reference: {
        description: 'Reference',
        arg: 2,
        expect: 2,
        decl: { type: 'number', reference: '__numRefTarget' }
    },
    macro: {
        description: 'Macro',
        arg: 2,
        expect: 2,
        decl: { macroFor: '__numRefTarget' }
    },
    circularReference: {
        description: 'Circular Reference',
        shouldThrow: true,
        decl: {
            type: 'any',
            reference: 'circularReference'
        }
    },
    circularMacro: {
        description: 'Circular Macro',
        shouldThrow: true,
        decl: {
            macroFor: 'circularMacro'
        }
    },
    referenceErrorReference: {
        description: 'Non-existent Reference',
        shouldThrow: true,
        decl: {
            type: 'any',
            reference: 'ruleThatDoesNotExist'
        }
    },
    referenceErrorMacro: {
        description: 'Non-existent Macro',
        shouldThrow: true,
        decl: {
            macroFor: 'ruleThatDoesNotExist'
        }
    }
};
