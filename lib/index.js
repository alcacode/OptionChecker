"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MAX_REFERENCE_DEPTH = 16;
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
function handleRuleError(type, decl, ruleName, subst_0) {
    let errorConst = undefined;
    let doWarn = decl.printWarnings === false ? false : true;
    let msg = '';
    switch (type) {
        case 1:
            msg = `Option object contains unrecognized option '${ruleName}'`;
            if (decl.throwOnUnrecognized === true)
                errorConst = Error;
            doWarn = false;
            break;
        case 2:
            msg = `Rule '${ruleName}' was discarded because it references non-existent rule '${subst_0}'`;
            if (decl.throwOnReferenceError === true)
                errorConst = ReferenceError;
            break;
        case 3:
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
function resolveReference(base, decl) {
    const refChain = [];
    let out = {};
    for (let i = 0, cur = base; i < MAX_REFERENCE_DEPTH; i++) {
        const rule = decl.options[cur];
        if (rule === undefined || rule.reference === undefined) {
            break;
        }
        else if (!(rule.reference in decl.options)) {
            handleRuleError(2, decl, base, rule.reference);
            return;
        }
        else if (refChain.includes(cur)) {
            handleRuleError(3, decl, base, rule.reference);
            break;
        }
        refChain.push(cur = rule.reference);
    }
    refChain.unshift(base);
    for (let i = refChain.length - 1; i >= 0; i--)
        out = Object.assign(out, decl.options[refChain[i]]);
    delete out.reference;
    return out;
}
function getRootMacro(base, decl) {
    let chain = new Set();
    let cur = decl.options[base].macroFor;
    for (let i = 0; i < MAX_REFERENCE_DEPTH; i++) {
        if (cur === undefined || !(cur in decl.options)) {
            handleRuleError(2, decl, base, cur);
            return;
        }
        else if (chain.has(cur)) {
            handleRuleError(3, decl, base, cur);
            return;
        }
        if (typeof decl.options[cur].macroFor !== 'string')
            break;
        cur = decl.options[cur].macroFor;
        chain.add(cur);
    }
    return cur;
}
function parseDeclaration(decl) {
    const out = Object.assign({}, decl);
    out.options = {};
    for (const k of Object.keys(decl.options)) {
        if (decl.options[k].reference) {
            const opt = resolveReference(k, decl);
            if (opt)
                out.options[k] = opt;
        }
        else {
            out.options[k] = decl.options[k];
        }
    }
    return out;
}
function invalid(opts, key, rule, reason) {
    var _a, _b;
    if (rule.required !== true) {
        if ('defaultValue' in rule)
            opts[(_a = rule.mapTo) !== null && _a !== void 0 ? _a : key] = rule.defaultValue;
        else
            delete opts[(_b = rule.mapTo) !== null && _b !== void 0 ? _b : key];
        return;
    }
    let optStr = `option ${key}`;
    if (rule.mapTo)
        optStr += ` (macro for ${rule.mapTo})`;
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
    var _a, _b, _c;
    const out = {};
    if (typeof opts !== 'object')
        opts = out;
    if (optDecl.throwOnUnrecognized === true) {
        for (const k of Object.keys(opts)) {
            if (!(k in optDecl.options))
                handleRuleError(1, optDecl, k);
        }
    }
    const defaultOverride = (_a = optDecl.allowOverride) !== null && _a !== void 0 ? _a : true;
    const decl = parseDeclaration(optDecl);
    const declKeys = Object.keys(decl.options)
        .sort((a, b) => (decl.options[a].mapTo ? 1 : 0) -
        (decl.options[b].mapTo ? 1 : 0));
    for (const k of declKeys) {
        let rule = decl.options[k];
        let optName;
        if (rule.macroFor) {
            const rootOpt = getRootMacro(k, decl);
            if (rootOpt)
                rule = decl.options[rootOpt];
            else
                continue;
            optName = rootOpt;
        }
        else {
            optName = (_b = rule.mapTo) !== null && _b !== void 0 ? _b : k;
            if (rule.mapTo && optName in out && !(rule.allowOverride || defaultOverride))
                continue;
        }
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
                rule.type = (_c = rule.type) === null || _c === void 0 ? void 0 : _c.toLowerCase();
                break;
        }
        out[optName] = opts[k];
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
