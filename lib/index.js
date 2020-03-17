"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function isObject(arg) {
    return typeof arg === 'object' || (arg instanceof Object);
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
        default:
            throw Error(`${optStr} is invalid`);
    }
}
function evalTestFn(val, fn, passFull, partial) {
    if (!(fn instanceof Function))
        return [true, val];
    if (passFull === true || val === undefined || val === null ||
        typeof val === 'symbol' ||
        !(val[Symbol.iterator] instanceof Function)) {
        return [!!fn.call(null, val), val];
    }
    const isStr = (typeof val === 'string');
    const isMapOrSet = val instanceof Map || val instanceof Set;
    let tmp;
    if (partial) {
        if (isStr)
            tmp = '';
        else
            tmp = new (SpeciesConstructor(val, Object));
    }
    let numValid = 0;
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
            numValid++;
        }
    }
    if (partial && numValid === 0)
        result = false;
    return [result, partial ? tmp : val];
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
        const rule = Object.create(optDecl.options[k]);
        let __internal_eq_val;
        let __internal_eq_flag = 0;
        if (rule.type === 'array') {
            rule.type = 'object';
            rule.instance = Array;
        }
        else if (rule.type === 'null') {
            rule.type = 'object';
            __internal_eq_flag = 1;
            __internal_eq_val = null;
        }
        else {
            rule.type = rule.type.toLowerCase();
        }
        out[k] = opts[k];
        if (!(k in opts)) {
            invalid(out, k, rule, 4);
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
        const valType = typeof value;
        if (rule.type !== valType) {
            invalid(out, k, rule, 5);
            continue;
        }
        if (__internal_eq_flag && value !== __internal_eq_val) {
            invalid(out, k, rule, 9);
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
        const passTest = evalTestFn(value, rule.passTest, rule.testFullValue, rule.allowPartialPass);
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
exports.OptionChecker = (function () {
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
