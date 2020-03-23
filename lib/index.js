"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isObject(arg) {
    return typeof arg === 'object' || (arg instanceof Object);
}
function isTypedArray(val) {
    return val instanceof Uint8Array.prototype.__proto__.constructor;
}
function isWellFormedIterator(val) {
    if (!(val instanceof Function))
        return false;
    const itr = val();
    let tmp;
    if (itr.next instanceof Function && isObject(tmp = itr.next()) &&
        typeof tmp.done === 'boolean' && 'value' in tmp)
        return true;
    return false;
}
function isArrayLike(val) {
    if (!isObject(val) || typeof val.length !== 'number')
        return false;
    return Array.isArray(val) || isTypedArray(val) ||
        Array.prototype[Symbol.iterator] === val[Symbol.iterator] ||
        isWellFormedIterator(val[Symbol.iterator]);
}
function isCoercable(rule) {
    switch (rule.type) {
        case 'bigint':
        case 'boolean':
        case 'number':
        case 'string':
            return true;
    }
    return false;
}
function isConstructor(arg) {
    return arg instanceof Object && typeof arg.constructor === 'function';
}
function ToNumber(val) {
    if (typeof val === 'number')
        return val;
    if (typeof val === 'bigint')
        return Number(val);
    if (typeof val === 'symbol')
        return NaN;
    return +val;
}
function coerceType(value, toType) {
    if (toType === 'bigint') {
        let v = null;
        try {
            v = BigInt(ToNumber(value));
        }
        catch (err) { }
        return v;
    }
    if (toType === 'boolean')
        return !!value;
    if (toType === 'number')
        return ToNumber(value);
    if (toType === 'string') {
        if (typeof value === 'symbol')
            return String(value);
        return '' + (value);
    }
    throw TypeError("invalid destination type");
}
function getSpecies(O) {
    if (!isObject(O))
        return;
    let S = undefined;
    try {
        S = O[Symbol.species];
    }
    finally {
    }
    if (S === undefined) {
        if (O.prototype)
            S = O.prototype;
        else
            S = O.__proto__;
    }
    return S;
}
function SpeciesConstructor(O, defaultConstructor) {
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
function invalid(opts, key, rule, reason) {
    if (!rule.required) {
        if ('defaultValue' in rule)
            opts[key] = rule.defaultValue;
        else
            delete opts[key];
        return;
    }
    const optStr = `option '${key}'`;
    switch (reason) {
        case 0:
            rule = rule;
            const rangeMax = 'max' in rule ? ' < ' + (rule.max + 1) : '';
            const rangeMin = 'min' in rule ? (rule.min - 1) + ' < ' : '';
            throw RangeError(`${optStr} is not within its allowed` +
                `range [${rangeMin}x${rangeMax}]`);
        case 1:
            throw RangeError(`${optStr} is not a finite number`);
        case 2:
            throw TypeError(`${optStr} must not be NaN`);
        case 3:
            throw TypeError(`${optStr} is not an integer`);
        case 4:
            throw ReferenceError(`${optStr} is required, but is not present`);
        case 5:
            throw TypeError(`${optStr} must be of type ${rule.type},` +
                ` got ${typeof opts[key]}`);
        case 6:
            throw Error(`${optStr} failed to validate`);
        case 7:
            rule = rule;
            if (typeof opts[key].length !== 'number')
                throw ReferenceError(optStr + 'has a specified max\
                                and/or min length but value lacks a length property');
            const lenMax = 'maxLength' in rule ?
                ' < ' + (rule.maxLength + 1) :
                '';
            const lenMin = 'minLength' in rule ?
                (rule.minLength - 1) + ' < ' :
                '';
            throw RangeError(`${optStr} has an invalid length, the` +
                ` allowed range is [${lenMin}length${lenMax}]`);
        case 8:
            rule = rule;
            if (rule.instance && rule.instance.name)
                throw TypeError(`${optStr} is not an instance of ${rule.instance.name}`);
            else
                throw TypeError(`${optStr} is not a valid instance type`);
        case 9:
            throw Error(`${optStr} has an unexpected value`);
        case 10:
            throw Error(`${optStr} is not an array-like Object`);
    }
    throw Error(`${optStr} is invalid (unknown reason)`);
}
function evalTestFn(val, fn, passFull, partial, cmpctArrLike) {
    if (!(fn instanceof Function))
        return [true, val];
    if (passFull === true || val === undefined || val === null ||
        typeof val === 'symbol' ||
        !(val[Symbol.iterator] instanceof Function)) {
        return [!!fn.call(null, val), val];
    }
    const isStr = (typeof val === 'string');
    const isMapOrSet = val instanceof Map || val instanceof Set;
    const isArrayLike = Array.isArray(val) || isTypedArray(val);
    let tmp;
    if (partial) {
        if (isStr)
            tmp = '';
        else
            tmp = new (SpeciesConstructor(val, Object));
    }
    let validIndicies = new Set();
    let result = true;
    let entries;
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
        }
        else if (partial) {
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
        tmp = tmp.filter((_, i) => validIndicies.has('' + i));
    validIndicies.clear();
    return [result, partial ? tmp : (tmp = null)];
}
function parseOptions(optDecl, opts) {
    const out = {};
    if (typeof opts !== 'object')
        opts = out;
    if (optDecl.throwOnUnrecognized) {
        for (const k of Object.keys(opts)) {
            if (!(k in optDecl.options))
                throw Error(`unrecognized option '${k}'`);
        }
    }
    for (const k of Object.keys(optDecl.options)) {
        let rule = Object.create(optDecl.options[k]);
        let __eq_val;
        let __eq_flag = false;
        let __skip_type_check = false;
        let __check_arraylike = false;
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
                rule.type = rule.type.toLowerCase();
                break;
        }
        out[k] = opts[k];
        if (!(k in opts)) {
            invalid(out, k, rule, 4);
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
        const valType = typeof value;
        if (rule.type !== valType && !__skip_type_check) {
            invalid(out, k, rule, 5);
            continue;
        }
        if (__eq_flag && value !== __eq_val) {
            invalid(out, k, rule, 9);
            continue;
        }
        if (__check_arraylike && !isArrayLike(value)) {
            invalid(out, k, rule, 10);
            continue;
        }
        if ('instance' in rule) {
            if (!isObject(value) ||
                !(value instanceof rule.instance)) {
                invalid(out, k, rule, 8);
                continue;
            }
        }
        if (valType === 'number' || valType === 'bigint') {
            if (('min' in rule && rule.min > value) ||
                ('max' in rule && rule.max < value)) {
                invalid(out, k, rule, 0);
                continue;
            }
        }
        else if (valType === 'string' || valType === 'object') {
            const len = typeof (value === null || value === void 0 ? void 0 : value.length) === 'number' ? value === null || value === void 0 ? void 0 : value.length :
                NaN;
            if (('minLength' in rule &&
                (len === NaN || rule.minLength > len)) ||
                ('maxLength' in rule &&
                    (len === NaN || rule.maxLength < len))) {
                invalid(out, k, rule, 7);
                continue;
            }
        }
        if (valType === 'number') {
            if ('notNaN' in rule && rule.notNaN && Number.isNaN(value)) {
                invalid(out, k, rule, 2);
                continue;
            }
            else if ('notInfinite' in rule && rule.notInfinite &&
                !Number.isFinite(value)) {
                invalid(out, k, rule, 1);
                continue;
            }
            else if ('notFloat' in rule && rule.notFloat &&
                !Number.isInteger(value)) {
                invalid(out, k, rule, 3);
                continue;
            }
        }
        const passTest = evalTestFn(value, rule.passTest, rule.testFullValue, rule.allowPartialPass, rule.compactArrayLike);
        if (!passTest[0]) {
            invalid(out, k, rule, 6);
            continue;
        }
        else {
            out[k] = passTest[1];
        }
    }
    return out;
}
exports.parseOptions = parseOptions;
exports.OptionCheckerConstructor = (function () {
    return function OptionChecker(optDecl, options) {
        if (new.target === undefined)
            throw TypeError("Constructor OptionChecker requires 'new'");
        let optVarName;
        if ('optVarName' in optDecl &&
            typeof optDecl.optVarName === 'string' &&
            optDecl.optVarName.length) {
            optVarName = optDecl.optVarName;
        }
        else {
            optVarName = 'options';
        }
        this[optVarName] = parseOptions(optDecl, options);
    };
})();
