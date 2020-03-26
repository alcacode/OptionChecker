declare interface TestConfigItem {
	/**
	 * Concise describing what is being tested. Values longer
	 * than 48 characters are trimmed.
	 */
	description?: string;

	/**
	 * Argument to provide during testing.
	 * @see `Function.prototype.apply()`
	 */
	arg?: any;

	/**
	 * Expected output. Defaults to value of `arg` if not set.
	 */
	expect?: any;

	/** Option rule to apply. */
	decl: OptionRule;

	/** If `true`, expect test to fail. */
	shouldFail?: boolean;

	/** If `true`, expect test to throw an exception. */
	shouldThrow?: boolean;
}

declare interface TestConfig {
	[key: string]: TestConfigItem;
}