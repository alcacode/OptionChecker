function isCoercable(rule: OptionRule): rule is CoercableOptionRuleType
{
	switch (rule.type) {
	case 'bigint':
	case 'boolean':
	case 'number':
	case 'string':
		return true;
	}

	return false;
}

function isObject(arg: any): arg is object
{
	return typeof arg === 'object' || (arg instanceof Object);
}

function isConstructor(arg: any): arg is new (...args: any[]) => any
{
	return arg instanceof Object && typeof arg.constructor === 'function';
}

function ToNumber(val: any): number {
	if (typeof val === 'number')
		return val;

	if (typeof val === 'bigint')
		return Number(val);

	// Converting a Symbol to Number is not allowed.
	if (typeof val === 'symbol')
		return NaN;

	return +val;
}

function coerceType(value: any, toType: CoercableTypes) {
	if (toType === 'bigint') {
		let v: BigInt | null = null;
		try {
			v = BigInt(ToNumber(value));
		} catch(err) { /* Intentionally left empty. */}

		return v;
	}

	if (toType === 'boolean')
		return !!value;

	if (toType === 'number')
		return ToNumber(value);

	if (toType === 'string') {
		// String concatenation with a Symbol is not allowed.
		if (typeof value === 'symbol')
			return String(value);

		return '' + (value);
	}

	throw TypeError("invalid destination type");
} 

function getSpecies<T extends any>(O: T): (new (...args: any[]) => any)|
	undefined
{
	if (!isObject(O))
		return;

	let S: (new (...args: any[]) => any)|undefined = undefined;

	try {
		S = O[Symbol.species];
	} finally { /* Intentionally left blank. */
	}

	if (S === undefined) {
		if (O.prototype)
			S = O.prototype;
		else
			S = O.__proto__;
	}

	return S;
}

function SpeciesConstructor<T extends any>(
	O: T, defaultConstructor: new (...args: any[]) => any)
{
	const C = O.constructor;
	if (C === undefined)
		return defaultConstructor;

	if (isObject(C)) {
		const S = getSpecies(C);
		if (S === undefined || S === null)
			return defaultConstructor;

		if (isConstructor(S))
			return S;
	}

	throw new TypeError(C + ' is not a valid constructor');
}

function invalid(opts: { [key: string]: any }, key: string, rule: OptionRule,
		 reason: ERR): void
{
	if (!rule.required) {
		if ('defaultValue' in rule)
			opts[key] = rule.defaultValue;
		else
			delete opts[key];

		return;
	}

	const optStr = `option '${key}'`;

	switch (reason) {
	case ERR.OUT_OF_RANGE:
		rule = rule as (OptionRuleNumber | OptionRuleBigint);
		const rangeMax = 'max' in rule ? ' < ' + (rule.max! + 1) : '';
		const rangeMin = 'min' in rule ? (rule.min! - 1) + ' < ' : '';

		throw RangeError(`${optStr} is not within its allowed` +
				 `range [${rangeMin}x${rangeMax}]`);
	case ERR.NOT_FINITE:
		throw RangeError(`${optStr} is not a finite number`);
	case ERR.NAN:
		throw TypeError(`${optStr} must not be NaN`);
	case ERR.NOT_INTEGER:
		throw TypeError(`${optStr} is not an integer`);
	case ERR.MISSING:
		throw ReferenceError(
			`${optStr} is required, but is not present`);
	case ERR.WRONG_TYPE:
		throw TypeError(`${optStr} must be of type ${rule.type},` +
				` got ${typeof opts[key]}`);
	case ERR.TEST_FAIL:
		throw Error(`${optStr} failed to validate`);
	case ERR.LENGTH_OUT_OF_RANGE:
		rule = rule as (OptionRuleObject | OptionRuleString);

		if (typeof opts[key].length !== 'number')
			throw ReferenceError(optStr + 'has a specified max\
                                and/or min length but value lacks a length property');

		const lenMax = 'maxLength' in rule ?
				       ' < ' + (rule.maxLength! + 1) :
				       '';
		const lenMin = 'minLength' in rule ?
				       (rule.minLength! - 1) + ' < ' :
				       '';

		throw RangeError(
			`${optStr} has an invalid length, the` +
			` allowed range is [${lenMin}length${lenMax}]`);
	case ERR.INVALID_INSTANCE:
		rule = rule as OptionRuleObject;
		if (rule.instance && rule.instance.name)
			throw TypeError(`${optStr} is not an instance of ${
				rule.instance.name}`);
		else
			throw TypeError(
				`${optStr} is not a valid instance type`);
	case ERR.UNEXPECTED_VALUE:
		throw Error(`${optStr} has an unexpected value`);
	default:
		throw Error(`${optStr} is invalid`);
	}
}

function evalTestFn(val: any, fn?: (arg: any) => boolean, passFull?: boolean,
		    partial?: boolean): [boolean, typeof val]
{
	if (!(fn instanceof Function))
		return [true, val];

	if (passFull === true || val === undefined || val === null ||
	    typeof val === 'symbol' ||
	    !(val[Symbol.iterator] instanceof Function)) {
		return [!!fn.call(null, val), val];
	}

	// Handle edge cases.
	const isStr = (typeof val === 'string');
	const isMapOrSet = val instanceof Map || val instanceof Set;

	let tmp: any;
	if (partial) {
		if (isStr)
			tmp = '';
		else
			tmp = new (SpeciesConstructor(val, Object));
	}

	let numValid = 0;
	let result = true;
	let entries: [string | number | symbol, any][];

	if (isMapOrSet)
		entries = [...val.entries()];
	else
		entries = Object.entries(val);

	for (const [k, v] of entries) {
		if (!fn.call(null, v)) {
			if (!partial) {
				result = false;
				break;
			}
		} else if (partial) {
			if (isStr)
				tmp += v;
			else if (isMapOrSet)
				'set' in tmp ? tmp.set(k, v) : tmp.add(v);
			else
				tmp[k] = v;

			numValid++;
		}
	}

	if (partial && numValid === 0)
		result = false;

	return [result, partial ? tmp : val];
}

export function parseOptions<O extends OptionList<any>>(
	optDecl: OptionDeclaration<O>,
	opts?: {[key: string]: any}): OptionList<O>
{
	const out: { [key: string]: any } = {};
	if (typeof opts !== 'object')
		opts = out;

	if (optDecl.throwOnUnrecognized) {
		for (const k of Object.keys(opts)) {
			if (!(k in optDecl.options))
				throw Error(`unrecognized option '${k}'`);
		}
	}

	for (const k of Object.keys(optDecl.options)) {
		const rule = Object.create(optDecl.options[k]) as OptionRule;
		let __internal_eq_val;
		let __internal_eq_flag = 0;

		// Convert macro types.
		if (rule.type === 'array') {
			rule.type = 'object';
			rule.instance = Array;
		} else if (rule.type === 'null') {
			rule.type = 'object';
			__internal_eq_flag = 1;
			__internal_eq_val = null;
		} else {
			rule.type = rule.type.toLowerCase() as OptionCheckerTypes;
		}

		// Work on a copy to prevent side effects.
		out[k] = opts[k];
		if (!(k in opts)) {
			invalid(out, k, rule, ERR.MISSING);
			continue;
		}

		let value = opts[k];

		if (isCoercable(rule) && rule.coerceType === true)
			value = coerceType(value, rule.type);

		if (rule.type !== typeof value &&
			rule.onWrongType instanceof Function)
			value = rule.onWrongType.call(null, value);

		if (rule.transformFn instanceof Function)
			value = rule.transformFn.call(null, value);

		/** Final value type. */
		const valType = typeof value;
		if (rule.type !== valType) {
			invalid(out, k, rule, ERR.WRONG_TYPE);
			continue;
		}

		if (__internal_eq_flag && value !== __internal_eq_val) {
			invalid(out, k, rule, ERR.UNEXPECTED_VALUE);
			continue;
		}

		if ('instance' in rule) {
			if (!isObject(value) ||
			    !(value instanceof rule.instance!)) {
				invalid(out, k, rule, ERR.INVALID_INSTANCE);
				continue;
			}
		}

		/* Value range and length complicance. */
		if (valType === 'number' || valType === 'bigint') {
			if (('min' in rule && rule.min! > value) ||
			    ('max' in rule && rule.max! < value)) {
				invalid(out, k, rule, ERR.OUT_OF_RANGE);
				continue;
			}
		} else if (valType === 'string' || valType === 'object') {
			const len: number = typeof value?.length === 'number' ?
						    value?.length :
						    NaN;
			if (('minLength' in rule &&
			     (len === NaN || rule.minLength! > len)) ||
			    ('maxLength' in rule &&
			     (len === NaN || rule.maxLength! < len))) {
				invalid(out, k, rule, ERR.LENGTH_OUT_OF_RANGE);
				continue;
			}
		}

		if (valType === 'number') {
			if ('notNaN' in rule && rule.notNaN && Number.isNaN(value)) {
				invalid(out, k, rule, ERR.NAN);
				continue;
			} else if ('notInfinite' in rule && rule.notInfinite &&
				   !Number.isFinite(value)) {
				invalid(out, k, rule, ERR.NOT_FINITE);
				continue;
			} else if ('notFloat' in rule && rule.notFloat &&
				   !Number.isInteger(value)) {
				invalid(out, k, rule, ERR.NOT_INTEGER);
				continue;
			}
		}

		const passTest = evalTestFn(value, rule.passTest, rule.testFullValue,
					    rule.allowPartialPass);
		if (!passTest[0]) {
			invalid(out, k, rule, ERR.TEST_FAIL);
			continue;
		} else {
			out[k] = passTest[1];
		}
	}

	return out as OptionList<O>;
}

export const OptionChecker = (function() {
	return function OptionChecker(this: {
		       [optVarName: string]: ReturnType<typeof parseOptions>
	       },
				      optDecl: OptionDeclaration,
				      options?: { [key: string]: any }) {
		if (new.target === undefined)
			throw TypeError("Constructor OptionChecker requires 'new'");

		let optVarName: string;
		if ('optVarName' in optDecl &&
		    typeof optDecl.optVarName === 'string' &&
		    optDecl.optVarName.length) {
			optVarName = optDecl.optVarName;
		} else {
			optVarName = 'options';
		}

		this[optVarName] = parseOptions(optDecl, options);
	} as unknown as OptionCheckerConstructor;
})();