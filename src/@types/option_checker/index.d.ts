/** ES-6 types. */
declare type BaseTypes = ('object' | 'function' | 'number' | 'bigint' |
			  'string' | 'undefined' | 'boolean' | 'symbol');

declare type MacroTypes = ('any' | 'array' | 'null' | 'int' | 'arraylike');

declare type OptionCheckerTypes = BaseTypes | MacroTypes;

declare type CoercableTypes = ('bigint' | 'boolean' | 'number' | 'string');

declare type TypedArrayInstance =
	(Int8Array | Int16Array | Int32Array | BigInt64Array | Uint8Array |
	 Uint8ClampedArray | Uint16Array | Uint32Array | BigUint64Array |
	 Float32Array | Float64Array);

declare interface ArrayLike<T> {
	[Symbol.iterator](): IterableIterator<T>
}

declare interface OptTransform<T = any> {
	/**
	 * If present and type does not match type of value, replace value with
	 * the return value of `onWrongType` called with itself as the
	 * first argument.\
	 * \
	 * Note: `onWrongType` is called _before_ `transformFn`.
	 */
	onWrongType?: (value: any) => T;

	/**
	 * If present, replace value with the return value of
	 * `transformFn` called with itself as the first
	 *  argument.\
	 * \
	 * Note: `transformFn` is called _after_ `onWrongType`.
	 */
	transformFn?: (value: any) => T;
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

declare interface OptCoerceType {
	/**
	 * If `true`, attempt to convert value to the one specified in `type`.
	 */
	coerceType?: boolean;
}

declare interface OptCompactArrayLike {
	/**
	 * If `true`, remove any gaps resulting from a partial pass. Instances
	 * of `Array` and `TypedArray` are considered array-like.
	 * 
	 * Note: Has no effect if `allowPartialPass` is not `true`.
	 */
	compactArrayLike?: boolean;
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
	passTest?: (value: any) => boolean;

	/**
	 * Pass the entire value to `passTest` regardless of type.
	 * Default: `false`.
	 */
	testFullValue?: boolean;

	/**
	 * Replace `string` and `object` values with the intersection of the
	 * set of given values and the set of possible valid values.
	 * Default: `false`.
	 */
	allowPartialPass?: boolean;

	/**
	 * Use the rules of another option and map output to it. _All_ other
	 * options are discarded if set. If the referenced rule does not exist,
	 * a warning message will be printed and the option will be discarded.
	 */
	macroFor?: string;

	/**
	 * If set, inherits the rules of the referenced rule. If the referenced
	 * rule does not exist, a warning message will be printed and the option
	 * will be discarded. If the reference is circular a warning message is
	 * printed and the reference is ignored, but the rule is kept.
	 */
	reference?: string;

	/** Map option to a different property key in the output object. */
	mapTo?: string;

	/**
	 * If `true`, a mapped option may overwrite the option it is mapped to
	 * (the last valid value is used). If `false`, a mapped option will only
	 * used when the option it is mapped to is either missing or invalid.
	 * Defaults to the value of the global `allowOverride`.
	 */
	allowOverride?: boolean;
}

declare interface OptionRuleBoolean extends OptCoerceType {
	type: 'boolean';
}

declare interface OptionRuleString extends OptLength, OptCoerceType {
	type: 'string';
}

declare interface OptionRuleMacro { macroFor: string; type?: undefined; }
declare interface OptionRuleAny { type: 'any'; }
declare interface OptionRuleNull { type: 'null'; }
declare interface OptionRuleUndefined { type: 'undefined'; }
declare interface OptionRuleSymbol { type: 'symbol'; }

declare interface OptionRuleObject extends OptLength, OptInstance, OptCompactArrayLike {
	type: 'object' | 'arraylike';
}

declare interface OptionRuleFunction extends OptLength, OptInstance {
	type: 'function';
}

declare interface OptionRuleArray extends OptLength, OptCompactArrayLike {
	type: 'array';
}

declare interface OptionRuleNumber extends OptRange, OptCoerceType {
	type: 'number' | 'int';

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

declare interface OptionRuleBigint extends OptRange, OptCoerceType {
	type: 'bigint';
}

declare type OptionRule =
	OptionRuleBase &
	 (OptionRuleObject | OptionRuleString | OptionRuleFunction |
	  OptionRuleUndefined | OptionRuleNumber | OptionRuleBigint |
	  OptionRuleBoolean | OptionRuleArray | OptionRuleSymbol |
	  OptionRuleNull | OptionRuleAny | OptionRuleMacro);

declare type CoercableOptionRuleType = OptionRuleBase & { type: CoercableTypes };

declare type OptionList<O extends { [key: string]: any }> = {
	[P in keyof O]: OptionRule
}

declare interface OptionDeclaration<O = { [key: string]: any}> {
	/**
	 * If `true`, throw an exception if a rule contains circular
	 * references.\ Default: `false`
	 */
	throwOnCircularReference?: boolean;

	/**
	 * If `true`, throw a `ReferenceError` if a rule contains references to
	 * non-existent rules.\ Default: `false`
	 */
	throwOnReferenceError?: boolean;

	/**
	 * If `true`, throw  an exception if undeclared
	 * properties are found on the option object.\
	 * Default: `false`
	 */
	throwOnUnrecognized?: boolean;

	/**
	 * If `true`, print warnings when encountering non-fatal errors.\
	 * Default: `true`
	 */
	printWarnings?: boolean;

	/**
	 * Property key to use for parsed options in `OptionChecker`.
	 * Defaults to "options" when not set or value is empty.
	 */
	optVarName?: string;

	/** Object containing individual option rules. */
	options: OptionList<O>;

	/**
	 * (Global) Overrides the default value of `allowOverride`. Does _not_
	 * override individually set `allowOverride`. Default: `true`.
	 */
	allowOverride?: boolean;
}

declare interface OptionCheckerConstructor {
	new <OptName extends string = 'options', OptList extends { [x: string]: any } = any>(optDecl: OptionDeclaration<any>, options?: { [key: string]: any }): {
		[o in OptName]: {
			[k in keyof OptList]: OptList[k]
		}
	}
}

declare const enum RULE_ERROR {
	UNRECOGNIZED_OPTION = 1,
	REFERENCE_ERROR = 2,
	CIRCULAR_REFERENCE = 3
}

declare const enum ERR {
	OUT_OF_RANGE,
	NOT_FINITE,
	NAN,
	NOT_INTEGER,
	MISSING,
	WRONG_TYPE,
	TEST_FAIL,
	LENGTH_OUT_OF_RANGE,
	INVALID_INSTANCE,
	UNEXPECTED_VALUE,
	NOT_ARRAY_LIKE
}

declare const enum COERCE_TYPE {
	BIGINT,
	BOOLEAN,
	NUMBER,
	STRING
}

declare interface Uint8Array {
	__proto__: {
		constructor: Function
	}
}