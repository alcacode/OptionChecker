export const testConfig: TestConfig = {
        basic: {
                description: 'Basic',
                arg: 123,
                decl: { type: 'number' }
        },
        minValValid: {
                description: 'Minimum value',
                arg: 2,
                decl: {
                        type: 'number',
                        min: 2
                }
        },
        minValInvalid: {
                description: 'Minimum value (invalid)',
                arg: 2,
                shouldFail: true,
                decl: {
                        type: 'number',
                        min: 3
                }
        },
        maxValValid: {
                description: 'Maximum value',
                arg: 2,
                decl: {
                        type: 'number',
                        max: 2
                }
        },
        maxValInvalid: {
                description: 'Maximum value (invalid)',
                arg: 2,
                shouldFail: true,
                decl: {
                        type: 'number',
                        max: 1
                }
        },
        minMaxValValid: {
                description: 'Minimum & Maximum value',
                arg: 2,
                decl: {
                        type: 'number',
                        min: 1,
                        max: 3
                }
        },
        minMaxValInvalid: {
                description: 'Minimum & Maximum value (invalid)',
                arg: 0,
                shouldFail: true,
                decl: {
                        type: 'number',
                        min: 1,
                        max: 3
                }
        },
        numFromString: {
                description: 'String to Number',
                arg: '123',
                expect: 123,
                decl: {
                        type: 'number',
                        coerceType: true
                }
        },
        numFromStringInvalid: {
                description: 'String to Number (invalid)',
                arg: 'aaa',
                shouldFail: true,
                decl: {
                        type: 'number',
                        coerceType: true
                }
        },
        numFromBigInt: {
                description: 'BigInt to Number',
                arg: BigInt(123),
                expect: 123,
                decl: {
                        type: 'number',
                        coerceType: true
                }
        },
        numFromBoolean: {
                description: 'Boolean to Number',
                arg: true,
                expect: 1,
                decl: {
                        type: 'number',
                        coerceType: true
                }
        }
}