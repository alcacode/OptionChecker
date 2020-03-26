import { TestConfig } from "option_checker";

const genericArrayLike: { [x: number]: any, length: number, [Symbol.iterator](): Iterator<any> } = {
        '0': 1,
        '1': 2,
        '2': 3,
        'length': 3,
        [Symbol.iterator]: function*(): Iterator<any> {
                for (const k in this) {
                        if (!Number.isNaN(+k))
                                yield this[k];
                }
        }
};

export const testConfig: TestConfig = {
	array: {
                description: 'Array',
		arg: [1, 2, 3],
		decl: { type: 'arraylike' }
        },
        typedArray: {
                description: 'Typed Array',
                arg: new Uint8Array([1,2,3]),
                decl: { type: 'arraylike' }
        },
        generic: {
                description: 'Array-like Object',
                arg: genericArrayLike,
                decl: { type: 'arraylike' }
        }
};