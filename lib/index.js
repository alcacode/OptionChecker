function isObject(arg) {
    return typeof arg === 'object' || (arg instanceof Object);
}
function isConstructor(arg) {
    return arg instanceof Object && typeof arg.constructor === 'function';
}
function getSpecies(O) {
    if (!isObject(O))
        return;
    let S = undefined;
    try {
        S = O[Symbol.species];
    }
    finally { }
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
            const lenMax = 'maxLength' in rule ? ' < ' + (rule.maxLength + 1) :
                '';
            const lenMin = 'minLength' in rule ? (rule.minLength - 1) + ' < ' :
                '';
            throw RangeError(`${optStr} has an invalid length, the` +
                ` allowed range is [${lenMin}length${lenMax}]`);
        case 8:
            rule = rule;
            if (rule.instance && rule.instance.name)
                throw TypeError(`${optStr} is not an instance of ${rule.instance.name}`);
            else
                throw TypeError(`${optStr} is not a valid instance type`);
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
    let tmp;
    if (isStr)
        tmp = '';
    else
        tmp = new (SpeciesConstructor(val, Object));
    let result = true;
    for (const [k, v] of Object.entries(val)) {
        if (!fn.call(null, v)) {
            if (!partial) {
                result = false;
                break;
            }
        }
        else {
            if (isStr)
                tmp += v;
            else
                tmp[k] = v;
        }
    }
    return [result, tmp];
}
export function parseOptions(optDecl, opts) {
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
        if (rule.type === 'array') {
            rule.type = 'object';
            rule.instance = Array;
        }
        out[k] = opts[k];
        if (!(k in opts)) {
            invalid(out, k, rule, 4);
            continue;
        }
        const validTypes = (typeof rule.type === 'string' ?
            [rule.type] :
            rule.type);
        let value = opts[k];
        if (rule.type === 'boolean' && rule.toBool === true)
            if (!validTypes.includes(typeof value) &&
                rule.typeTransformFn instanceof Function)
                value = rule.typeTransformFn(value);
        if (rule.valueTransformFn instanceof Function)
            value = rule.valueTransformFn(value);
        const valType = typeof value;
        if (!validTypes.includes(valType)) {
            invalid(out, k, rule, 5);
            continue;
        }
        if ('instance' in rule) {
            if (!isObject(value) || !(value instanceof rule.instance)) {
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
            const len = typeof value.length === 'number' ?
                value.length :
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
            if ('notNaN' in rule && rule.notNaN && value === NaN) {
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
        const passTest = evalTestFn(value, rule.passTest, rule.passFull, rule.allowPartial);
        if (!passTest[0]) {
            invalid(out, k, rule, 6);
            continue;
        }
        out[k] = passTest[1];
    }
    return out;
}
export class OptionChecker {
    constructor(optDecl, options) {
        this.options = {};
        this.options = parseOptions(optDecl, options);
    }
}
