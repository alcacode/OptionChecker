"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const generic_1 = require("./generic");
const string_1 = require("./string");
const array_1 = require("./array");
const arraylike_1 = require("./arraylike");
const number_1 = require("./number");
const VERBOSE_OUTPUT = false;
const OUTPUT_MAX_LENGTH = 60;
const tests = {
    any: generic_1.testConfig,
    string: string_1.testConfig,
    array: array_1.testConfig,
    arrayLike: arraylike_1.testConfig,
    number: number_1.testConfig,
};
function centerAndPad(str, fillString) {
    const l1 = Math.floor((OUTPUT_MAX_LENGTH + str.length) / 2);
    return str.padStart(l1, fillString)
        .padEnd(OUTPUT_MAX_LENGTH, fillString);
}
function getPrototype(obj) {
    if ('prototype' in obj)
        return obj.prototype;
    if ('__proto__' in obj)
        return obj.__proto__;
    if (typeof obj === 'object')
        return null;
    return undefined;
}
function areObjectsSimilar(a, b) {
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (getPrototype(a) !== getPrototype(b))
        return false;
    const aProps = Object.getOwnPropertyDescriptors(a);
    const bProps = Object.getOwnPropertyDescriptors(b);
    for (const k in aProps) {
        if (!aProps.hasOwnProperty(k))
            continue;
        if (!(k in bProps))
            return false;
        if (aProps[k].configurable !== bProps[k].configurable ||
            aProps[k].enumerable !== bProps[k].enumerable ||
            aProps[k].writable !== bProps[k].writable ||
            aProps[k].value !== bProps[k].value ||
            aProps[k].get !== bProps[k].get ||
            aProps[k].set !== bProps[k].set) {
            return false;
        }
    }
    for (const k in bProps) {
        if (!(k in aProps))
            return false;
    }
    return true;
}
exports.areObjectsSimilar = areObjectsSimilar;
let resCount = [0, 0];
for (const ck in tests) {
    console.groupCollapsed(centerAndPad(` ${ck.toUpperCase()} `, '='));
    for (const tk in tests[ck]) {
        const t = tests[ck][tk];
        const decl = {
            options: {
                [tk]: t.decl
            }
        };
        const expect = t.shouldFail || t.shouldThrow ?
            undefined :
            'expect' in t ? t.expect : t.arg;
        let descStr = (t.description || tk).substring(0, 48);
        if (t.description && t.description.length >= 48)
            descStr += '…';
        let res = {};
        let didParse = false;
        let errMsg = '';
        try {
            res = index_1.parseOptions(decl, 'arg' in t ? { [tk]: t.arg } : undefined);
            didParse = true;
        }
        catch (err) {
            errMsg = err instanceof Error ? err.message :
                'unknown error';
        }
        const gotExpected = areObjectsSimilar(res[tk], expect);
        let didPass = didParse && gotExpected;
        if (t.shouldThrow)
            didPass = !didParse;
        if (t.shouldFail && !didPass)
            didPass = true;
        resCount[didPass ? 0 : 1] += 1;
        if (!didPass || VERBOSE_OUTPUT) {
            console.log(`\n> ${descStr}`);
            console.log('Input:        ', ('arg' in t ? t.arg : '<no argument>'));
            console.log('Output:       ', didParse ? res[tk] : '<no return value>');
            console.log('Expected:     ', t.shouldThrow ? 'N/A' : expect);
            console.log('Should Fail:  ', t.shouldFail ? 'Yes' : 'No');
            console.log('Should Throw: ', t.shouldThrow ? 'Yes' : 'No');
            let resStr = `Result:       %c${didPass ? 'PASSED' : 'FAILED'}%c`;
            if (!didParse)
                resStr += `, exception${errMsg ? ` %c(${errMsg})` : ''}`;
            else if (!(tk in res))
                resStr += ', option discarded';
            else if (!gotExpected)
                resStr += `, unexpected value`;
            console.log(resStr, `color:${didPass ? 'green' : 'red'};font-weight:600;`, '');
        }
        else {
            console.log(`${descStr.padEnd(48, ' ')} [PASSED]`);
        }
    }
    console.groupEnd();
    console.log();
}
const totalRes = resCount[0] + resCount[1];
console.log(`Passed: ${resCount[0]} / ${totalRes}`);
console.log(`Failed: ${resCount[1]} / ${totalRes}`);
console.log(`Final result: ${resCount[0] === totalRes ? 'PASS' : 'FAIL'}`);
