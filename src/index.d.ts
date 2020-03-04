declare type JSType = ('object' | 'function' | 'number' | 'bigint' | 'string' |
		       'undefined' | 'boolean' | 'symbol' | 'array');

declare interface OptTransform<T = any> {
	/**
	 * If present and type does not match type of value, replace value with
	 * the return value of `typeTransformFn` called with itself as the
	 * first argument.\
	 * \
	 * Note: `typeTransformFn` is called _before_ `valueTransformFn`.
	 */
	typeTransformFn?: (arg: any) => T;

	/**
	 * If present, replace value with the return value of `transformFn`
	 * called with itself as the first argument.\
	 * \
	 * Note: `valueTransformFn` is called _after_ `typeTransformFn`.
	 */
	valueTransformFn?: (arg: any) => T;
}

declare interface OptLength {
	/**
	 * Maximum allowed length. Ignored if value lacks a numeric `length`
	 * property.
	 */
	maxLength?: number;
	/**
	 * Minimum allowed length. Ignored if value lacks a numeric `length`
	 * property.
	 */
	minLength?: number;
}

declare interface OptInstance {
	/** If present, reject values that are not instances of `instance`. */
	instance?: new(...args: any[]) => any;
}

declare interface OptRange {
	/**
	 * Maximum numeric value. Ignored if type is not `number` or `bigint`.
	 */
	max?: number;
	/**
	 * Minimum numeric value. Ignored if type is not `number` or `bigint`.
	 */
	min?: number;
}

declare interface OptionRuleBase extends OptTransform {
	/** If `true` throw an exception if value is missing or invalid. */
	required?: boolean;

	/**
	 * Value used to replace missing or invalid values with.\
	 * Ignored if `required` is `true`.
	 */
	defaultValue?: any;

	/**
	 * If present, pass value as argument to `passTest` and reject those
	 * where the return value is not `true`.\
	 * If the value is iterable then member items will be passed
	 * individually.
	 *
	 * This behavior can be overriden by `passFull`.
	 */
	passTest?: (arg: any) => boolean;

	/**
	 * Pass the entire value to `passTest` regardless of type.
	 * Default: `false`.
	 */
	passFull?: boolean;

	/**
	 * Replace `string` and `object` values with the intersection of the
	 * set of given values and the set of possible valid values.
	 * Default: `false`.
	 */
	allowPartial?: boolean;
}

declare interface OptionRuleBoolean {
	type: 'boolean';

	/** If value is truthy convert to `true`, otherwise `false`. */
	toBool?: boolean;
}

declare interface OptionRuleString extends OptLength {
	type: 'string'|(['string']&Exclude<JSType, 'string'>[]);
}

declare interface OptionRuleUndefined {
	type: 'undefined'|(['undefined']&Exclude<JSType, 'undefined'>[]);
}

declare interface OptionRuleObject extends OptLength, OptInstance {
	type: 'object'|(['object']&Exclude<JSType, 'object'>[]);
}

declare interface OptionRuleFunction extends OptLength, OptInstance {
	type: 'function'|(['function']&Exclude<JSType, 'function'>[]);
}

declare interface OptionRuleArray extends OptLength, OptInstance {
	type: 'array'|(['array']&Exclude<JSType, 'array'>[]);
}

declare interface OptionRuleNumber extends OptRange {
	type: 'number'|(['number']&Exclude<JSType, 'number'>[]);

	/** If `true`, reject non-integer values. */
	notFloat?: boolean;

	/** If `true`, reject NaN-values. */
	notNaN?: boolean;

	/**
	 * If `true`, reject non-finite values. If `false`, allow infinite
	 * values.
	 */
	notInfinite?: boolean;
}

declare interface OptionRuleBigint extends OptRange {
	type: 'bigint'|(['bigint']&Exclude<JSType, 'bigint'>[]);
}

declare type OptionRule =
	OptionRuleBase &
	(OptionRuleObject | OptionRuleString | OptionRuleFunction |
	 OptionRuleUndefined | OptionRuleNumber | OptionRuleBigint |
	 OptionRuleBoolean | OptionRuleArray);

declare interface OptionDeclaration {
	throwOnUnrecognized?: boolean;
	options: { [key: string]: OptionRule }
}

declare const enum ERRVAL {
	OUT_OF_RANGE,
	NOT_FINITE,
	NAN,
	NOT_INTEGER,
	MISSING,
	WRONG_TYPE,
	TEST_FAIL,
	LENGTH_OUT_OF_RANGE,
	INVALID_INSTANCE
}