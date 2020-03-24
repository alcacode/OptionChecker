"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const genericArrayLike = {
    '0': 1,
    '1': 2,
    '2': 3,
    'length': 3,
    [Symbol.iterator]: function* () {
        for (const k in this) {
            if (!Number.isNaN(+k))
                yield this[k];
        }
    }
};
exports.testConfig = {
    array: {
        description: 'Array',
        arg: [1, 2, 3],
        decl: { type: 'arraylike' }
    },
    typedArray: {
        description: 'Typed Array',
        arg: new Uint8Array([1, 2, 3]),
        decl: { type: 'arraylike' }
    },
    generic: {
        description: 'Array-like Object',
        arg: genericArrayLike,
        decl: { type: 'arraylike' }
    }
};
