const MAX_REFERENCE_DEPTH = 16;

function isObject(arg: any): arg is object
{
	return typeof arg === 'object' || (arg instanceof Object);
}

function isTypedArray(val: any): val is TypedArrayInstance {
	return val instanceof Uint8Array.prototype.__proto__.constructor;
}

function isWellFormedIterator(val: any): val is Iterator<any>
{
	if (!(val instanceof Function))
		return false;

	const itr = val();
	let tmp;
	if (itr.next instanceof Function && isObject(tmp = itr.next()) &&
	    typeof tmp.done === 'boolean' && 'value' in tmp)
		return true;

	return false;
}

function isArrayLike<T extends ArrayLike<any>>(val: T): val is T
{
	if (!isObject(val) || typeof val.length !== 'number')
		return false;

	return Array.isArray(val) || isTypedArray(val) ||
	       Array.prototype[Symbol.iterator] === val[Symbol.iterator] ||
	       isWellFormedIterator(val[Symbol.iterator]);
}

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

function handleRuleError(type: RULE_ERROR.CIRCULAR_REFERENCE, decl: OptionDeclaration<any>, ruleName: string, lastNonCirc?: string): void;
function handleRuleError(type: RULE_ERROR.REFERENCE_ERROR, decl: OptionDeclaration<any>, ruleName: string, faultRefName?: string): void;
function handleRuleError(type: RULE_ERROR.UNRECOGNIZED_OPTION, decl: OptionDeclaration<any>, ruleName: string): void;
function handleRuleError(type: RULE_ERROR, decl: OptionDeclaration<any>, ruleName: string, subst_0?: string): void {
	let errorConst: ErrorConstructor | undefined = undefined;
	let doWarn = decl.printWarnings === false ? false : true;
	let msg = '';

	switch (type) {
	case RULE_ERROR.UNRECOGNIZED_OPTION:
		msg = `Option object contains unrecognized option '${ruleName}'`;
		if (decl.throwOnUnrecognized === true)
			errorConst = Error;

		doWarn = false;
		break;
	case RULE_ERROR.REFERENCE_ERROR:
		msg = `Rule '${ruleName}' was discarded because it references non-existent rule '${subst_0}'`;

		if (decl.throwOnReferenceError === true)
			errorConst = ReferenceError;

		break;
	case RULE_ERROR.CIRCULAR_REFERENCE:
		if (ruleName === subst_0)
			msg = `Rule '${ruleName}' references itself`;
		else
			msg = `Rule '${ruleName}' forms a circular reference after rule ${subst_0}`;

		if (decl.throwOnCircularReference === true)
			errorConst = Error;

		break;
	}

	if (errorConst instanceof Function)
		throw errorConst(msg);
	else if (doWarn)
		console.warn(msg);
}

function resolveReference<O extends OptionList<any>>(base: string, decl: OptionDeclaration<O>): OptionRule | undefined {
	const refChain: (keyof O)[] = [];
	let out: Partial<OptionRule> = {};

	for (let i = 0, cur = base; i < MAX_REFERENCE_DEPTH; i++) {
		const rule = decl.options[cur];

		if (rule === undefined || rule.reference === undefined) {
			break;
		} else if (!(rule.reference in decl.options)) {
			handleRuleError(RULE_ERROR.REFERENCE_ERROR, decl, base, rule.reference);
			return;
		} else if (refChain.includes(cur)) {
			handleRuleError(RULE_ERROR.CIRCULAR_REFERENCE, decl, base, rule.reference);
			break;
		}

		cur = rule.reference;
		if ('macroFor' in decl.options[cur])
			cur = getRootMacro<O>(decl.options[cur].macroFor!, decl) as string;

		if (cur)
			refChain.push();
	}

	refChain.unshift(base);

	// Do in reverse so that values further up the reference chain take
	// precedence.
	for (let i = refChain.length - 1; i >= 0; i--)
		out = Object.assign(out, decl.options[refChain[i]]);

	delete out.reference;

	return out as OptionRule;
}

function getRootMacro<O extends OptionList<any>, D extends O = any>(base: string, decl: OptionDeclaration<D>): keyof O | undefined {
	let chain: Set<keyof O> = new Set();
	let cur: string | undefined = decl.options[base].macroFor;

	for (let i = 0; i < MAX_REFERENCE_DEPTH; i++) {
		if (cur === undefined || !(cur in decl.options)) {
			handleRuleError(RULE_ERROR.REFERENCE_ERROR, decl, base, cur);
			return;
		} else if (chain.has(cur)) {
			handleRuleError(RULE_ERROR.CIRCULAR_REFERENCE, decl, base, cur);
			return;
		}

		if (typeof decl.options[cur].macroFor !== 'string')
			break;

		cur = decl.options[cur].macroFor!;
		chain.add(cur);
	}

	return cur;
}

/** Returns a new declaration based on `decl` with all references resolved. */
function parseDeclaration<O extends { [key: string]: any }>(
	decl: OptionDeclaration<O>): OptionDeclaration<Partial<O>>
{
	const out = Object.assign({}, decl);
	out.options = {} as OptionList<O>;

	for (const k of Object.keys(decl.options) as (keyof O)[]) {
		if (decl.options[k].reference && !decl.options[k].macroFor) {
			const opt = resolveReference(k as string, decl);
			if (opt)
				out.options[k] = opt;
		} else {
			out.options[k] = decl.options[k];
		}
	}

	return out;
}

function invalid(opts: { [key: string]: any }, key: string, rule: OptionRule,
		 reason: ERR): void
{
	if (rule.required !== true) {
		if ('defaultValue' in rule)
			opts[rule.mapTo ?? key] = rule.defaultValue;
		else
			delete opts[rule.mapTo ?? key];

		return;
	}

	let optStr = `option ${key}`;
	if (rule.mapTo)
		optStr += ` (macro for ${rule.mapTo})`;

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
		throw ReferenceError(`${optStr} is required, but is not present`);
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
			throw TypeError(`${optStr} is not a valid instance type`);
	case ERR.UNEXPECTED_VALUE:
		throw Error(`${optStr} has an unexpected value`);
	case ERR.NOT_ARRAY_LIKE:
		throw Error(`${optStr} is not an array-like Object`);
	}

	throw Error(`${optStr} is invalid (unknown reason)`);
}

function evalTestFn(val: any, fn?: (arg: any) => boolean, passFull?: boolean,
		    partial?: boolean, cmpctArrLike?: boolean): [boolean, typeof val]
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
	const isArrayLike = Array.isArray(val) || isTypedArray(val);

	let tmp: any;
	if (partial) {
		if (isStr)
			tmp = '';
		else
			tmp = new (SpeciesConstructor(val, Object));
	}

	let validIndicies: Set<any> = new Set();
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

			validIndicies.add(k);
		}
	}

	if (partial && validIndicies.size === 0)
		result = false;

	if (result && isArrayLike && cmpctArrLike && validIndicies.size !== val.length)
		tmp = tmp.filter((_: any, i: number) => validIndicies.has('' + i));

	validIndicies.clear();
	return [result, partial ? tmp : (tmp = null)];
}

export function parseOptions<O extends { [key: string]: any }>(
	optDecl: OptionDeclaration<O>,
	opts?: {[key: string]: any}): OptionList<Partial<O>>
{
	const out: { [key: string]: any } = {};
	if (typeof opts !== 'object')
		opts = out;

	if (optDecl.throwOnUnrecognized === true) {
		for (const k of Object.keys(opts)) {
			if (!(k in optDecl.options))
				handleRuleError(RULE_ERROR.UNRECOGNIZED_OPTION, optDecl, k);
		}
	}

	const defaultOverride = optDecl.allowOverride ?? true;
	const decl = parseDeclaration<O>(optDecl);
	
	// Mapped options need to go last so that they do not take precedence in
	// case allowOverride is true.
	const declKeys = Object.keys(decl.options)
				 .sort((a, b) => (decl.options[a].mapTo ? 1 : 0) -
						 (decl.options[b].mapTo ? 1 : 0));

	for (const k of declKeys) {
		let rule = decl.options[k];
		let optName: string;

		if (rule.macroFor) {
			const rootOpt = getRootMacro<O>(k, decl);
			if (rootOpt)
				rule = decl.options[rootOpt];
			else
				continue;

			optName = rootOpt as string;
		} else {
			optName = rule.mapTo ?? k;
			if (rule.mapTo && optName in out && !(rule.allowOverride || defaultOverride))
				continue;
		}

		let __eq_val;
		let __eq_flag = false;
		let __skip_type_check = false;
		let __check_arraylike = false;

		/* Convert macro types. */
		switch (rule.type) {
		case 'array':
			rule = Object.assign(rule, { type: 'object', instance: Array });
			break;
		case 'arraylike':
			rule = Object.assign(rule, { type: 'object' });
			__check_arraylike = true;
			break;
		case 'null':
			rule = Object.assign(rule, { type: 'object' });
			__eq_flag = true;
			__eq_val = null;
			break;
		case 'int':
			rule.type = 'number';
			rule.notFloat = true;
			break;
		case 'any':
			__skip_type_check = true;
			break;
		default:
			rule.type = rule.type?.toLowerCase() as BaseTypes;
			break;
		}

		/* Work on a copy to prevent side effects. */
		out[optName] = opts[k];
		if (!(k in opts)) {
			invalid(out, k, rule, ERR.MISSING);
			continue;
		}

		let value = opts[k];

		if (isCoercable(rule) && !__skip_type_check)
			value = coerceType(value, rule.type);

		if (rule.type !== typeof value && !__skip_type_check &&
		    rule.onWrongType instanceof Function)
			value = rule.onWrongType.call(null, value);

		if (rule.transformFn instanceof Function)
			value = rule.transformFn.call(null, value);

		/** Final value type. */
		const valType = typeof value;
		if (rule.type !== valType && !__skip_type_check) {
			invalid(out, k, rule, ERR.WRONG_TYPE);
			continue;
		}

		if (__eq_flag && value !== __eq_val) {
			invalid(out, k, rule, ERR.UNEXPECTED_VALUE);
			continue;
		}

		if (__check_arraylike && !isArrayLike(value)) {
			invalid(out, k, rule, ERR.NOT_ARRAY_LIKE);
			continue;
		}

		if ('instance' in rule) {
			if (!isObject(value) ||
			    !(value instanceof rule.instance!)) {
				invalid(out, k, rule, ERR.INVALID_INSTANCE);
				continue;
			}
		}

		/* Test range and length. */
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

		const passTest =
			evalTestFn(value, rule.passTest, rule.testFullValue,
				   rule.allowPartialPass,
				   (rule as OptionRuleObject).compactArrayLike);

		if (!passTest[0]) {
			invalid(out, k, rule, ERR.TEST_FAIL);
			continue;
		} else {
			out[k] = passTest[1];
		}
	}

	return out as OptionList<O>;
}

export const OptionCheckerConstructor = (function() {
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