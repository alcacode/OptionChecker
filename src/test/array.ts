export const testConfig: TestConfig = {
	basic: {
		description: 'Basic',
		arg: [1, 2, 3],
		decl: {type: 'array'}
	},
	filter: {
		description: 'Filter',
		arg: [1, 2, 3],
		expect: [, 2, 3],
		decl: {
			type: 'array',
			passTest: (v) => v > 1,
			allowPartialPass: true
		}
	},
	filter_fail: {
		description: 'Filter (invalid)',
		arg: [1, 2, 3],
		expect: [],
		shouldFail: true,
		decl: {
			type: 'array',
			passTest: (v) => v > 1,
			allowPartialPass: true
		}
	},
	filter_cmpct: {
		description: 'Filter (compacted)',
		arg: [1, 2, 3],
		expect: [2, 3],
		decl: {
			type: 'array',
			passTest: (v) => v > 1,
			allowPartialPass: true,
			compactArrayLike: true
		}
	},
};