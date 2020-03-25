# option_checker

Provides the `parseOptions()` function and `OptionChecker` class.

The `parseOption()` function verifies an options-object according to a predefined declaration, and returns an object containing only valid values whose properties may be known in advance.
The `OptionChecker` class is an extensible class whose `constructor` calls `parseOption()` and assigns the return value to a predefined property (`options` by default) of the instance object.

## Installation

### NPM

```console
npm install alcacode/OptionChecker
```

### Manual

Download or clone the repository using `git clone https://github.com/alcacode/OptionChecker.git`.

## Usage

```typescript
// Declare what options are allowed.
const decl = {
  options: {
    str: {
      /*
       * Declare (required) what the expected type is after
       * any value transforming steps have taken place.
       */
      type: 'string',
      // Declare any optional requirements.
      minLength: 1,
      maxLength: 10,
      defaultValue: 'default'
    },
    num: {
      type: 'number',
      min: 10,
      max: 30,
      isNaN: false,
      /*
       * Function whose return value replace the option value,
       * if its type is invalid.
       */
      onWrongType: (v) => typeof v === 'string' ? +v : undefined
    }
  }
}

const parsedOptions = parseOptions(decl, providedOptions);
```

In the above example, `parsedOptions` is guaranteed to have `str` property with a `String` value of length between 1 and 10.
It will have a `num` property _if_ a `num` option with a non-`NaN` `Number` or `String` coercable to a `Number` value that is greater than or equal to `10` and less than or equal to `30` was provided.

## Table of Contents

- [option_checker](#optionchecker)
  - [Installation](#installation)
    - [NPM](#npm)
    - [Manual](#manual)
  - [Usage](#usage)
  - [Table of Contents](#table-of-contents)
  - [Option types](#option-types)
    - [ES6 Types](#es6-types)
    - [Macro Types](#macro-types)
      - [Array](#array)
      - [Int](#int)
      - [Null](#null)
    - [Special Types](#special-types)
      - [Any](#any)
      - [ArrayLike](#arraylike)
  - [The `OptionDeclaration` Object](#the-optiondeclaration-object)
    - [`OptionDeclaration.allowOverride`](#optiondeclarationallowoverride)
    - [`OptionDeclaration.throwOnCircularReference`](#optiondeclarationthrowoncircularreference)
    - [`OptionDeclaration.throwOnReferenceError`](#optiondeclarationthrowonreferenceerror)
    - [`OptionDeclaration.throwOnUnrecognized`](#optiondeclarationthrowonunrecognized)
    - [`OptionDeclaration.printWarnings`](#optiondeclarationprintwarnings)
    - [`OptionDeclaration.optVarName`](#optiondeclarationoptvarname)
    - [`OptionDeclaration.options`](#optiondeclarationoptions)
  - [The `OptionRule` Object](#the-optionrule-object)
    - [**`OptionRule.type`**](#optionruletype)
    - [`OptionRule.required`](#optionrulerequired)
    - [`OptionRule.allowOverride`](#optionruleallowoverride)
    - [`OptionRule.defaultValue`](#optionruledefaultvalue)
    - [`OptionRule.passTest(value)`](#optionrulepasstestvalue)
    - [`OptionRule.testFullValue`](#optionruletestfullvalue)
    - [`OptionRule.allowPartialPass`](#optionruleallowpartialpass)
    - [`OptionRule.onWrongType(value)`](#optionruleonwrongtypevalue)
    - [`OptionRule.transformFn(value)`](#optionruletransformfnvalue)
    - [`OptionRule.maxLength`](#optionrulemaxlength)
    - [`OptionRule.minLength`](#optionruleminlength)
    - [`OptionRule.instance`](#optionruleinstance)
    - [`OptionRule.max`](#optionrulemax)
    - [`OptionRule.min`](#optionrulemin)
    - [`OptionRule.notFloat`](#optionrulenotfloat)
    - [`OptionRule.notNaN`](#optionrulenotnan)
    - [`OptionRule.notInfinite`](#optionrulenotinfinite)
    - [`OptionRule.coerceType`](#optionrulecoercetype)
      - [Conversion to `bigint`](#conversion-to-bigint)
      - [Conversion to `boolean`](#conversion-to-boolean)
      - [Conversion to `number`](#conversion-to-number)
      - [Conversion to `string`](#conversion-to-string)
    - [`OptionRule.compactArrayLike`](#optionrulecompactarraylike)
    - [`OptionRule.mapTo`](#optionrulemapto)
    - [`OptionRule.macroTo`](#optionrulemacroto)
    - [`OptionRule.reference`](#optionrulereference)
      - [Example](#example)
  - [`parseOptions(optDecl[, opts])`](#parseoptionsoptdecl-opts)
    - [Parameters](#parameters)
    - [Returns](#returns)
    - [Exceptions](#exceptions)
    - [Example](#example-1)
  - [Class: `OptionChecker`](#class-optionchecker)
  - [`OptionChecker()`](#optionchecker-1)
    - [Parameters](#parameters-1)

## Option types

The following types can be used in `OptionRule`. Type value is case-insensitive.

### ES6 Types

- object
- function
- number
- bigint
- string
- undefined
- boolean
- symbol

### Macro Types

Macro types are types that expand to a built-in type with some specific configuration.

#### Array

Shorthand for 'object' where `instance` is `Array`.

#### Int

Shorthand for 'number' where `isFloat` is `false`.

#### Null

Shorthand for 'object' where the only allowed value is `null`.

### Special Types

Special types are types with specific behavior associated with them.

#### Any

Allows any type to pass. Prevents `onWrongType` from being called.

#### ArrayLike

Any `Array`, `TypedArray`, or `Object` with a `Number` valued `length` property and `@@iterable` method returning well-formed iterables.
An iterable is considered well-formed when it has a `value` property and a `Boolean` valued `done` property.

## The `OptionDeclaration` Object

The options declaration object is used to declare the requirements of applicable to options and to tweak the behavior of `parseOptions()`.

### `OptionDeclaration.allowOverride`

- <`boolean`>

Optional. Overrides the default value of `allowOverride`. Does _not_ override individually set `allowOverride`. Default: `true`.

### `OptionDeclaration.throwOnCircularReference`

- <`boolean`>

Optional. If `true`, throw an exception if a rule contains circular references. Default: `false`.

### `OptionDeclaration.throwOnReferenceError`

- <`boolean`>

Optional. If `true`, throw a `ReferenceError` if a rule contains references to non-existent rules. Default: `false`.

### `OptionDeclaration.throwOnUnrecognized`

- <`boolean`>

Optional. If `true`, causes any provided option not present in `OptionDeclaration.options` to throw an exception. Default: `false`.

### `OptionDeclaration.printWarnings`

- <`boolean`>

Optional. If `true`, a warning message will be emitted when reference errors or circular references are found. Default: `true`.

### `OptionDeclaration.optVarName`

- <`string`>

Optional. Property key used to store parsed options. Default: `options`.

### `OptionDeclaration.options`

- <`object`>

Object containing property keys that represent valid options. The only allowed value is `OptionRule`.

## The `OptionRule` Object

Object specifying limits for individual options.

### **`OptionRule.type`**

- <`string`>

Required. Case insensitive. One of `'object'`, `'function'`, `'number'`, `'bigint'`, `'string'`, `'undefined'`, `'boolean'`, `'symbol'`, `'array'`, `'null'`, or `'any'`.

Note: Although the option value is tested against the specified type, there are multiple ways of converting said value to an appropriate type. What it really means is that the _resulting value_ of any conversion attempts must adhere to the specified type.

### `OptionRule.required`

- <`boolean`>

Optional. If `true` an exception will be thrown if the option is missing or its value is invalid.

### `OptionRule.allowOverride`

- <`boolean`>

Optional. If `true`, a mapped option may overwrite the option it is mapped to (the last valid value is used). If `false`, a mapped option will only used when the option it is mapped to is either missing or invalid. Defaults to the value of the global `allowOverride`.

### `OptionRule.defaultValue`

- <`any`>

Optional. Value to use if option is missing or its value is invalid. If set, that option is guaranteed to exist in the parsed options object.

Note: If `required` is `true` this value is effectively ignored.

### `OptionRule.passTest(value)`

- `this` <`undefined`>
- `value` <`any`> Value of the option currently being evaluated or its member items if an `@@iterator` method is present.
- Returns: <`boolean`> `true` if test passed.

Optional. Function used to test option value. If the function returns `false` then the option is discarded.

### `OptionRule.testFullValue`

- <`boolean`>

Optional. Passes the entire option value to `passTest()` even if an `@@iterator` method is present. Does nothing if `passTest()` is not present.

### `OptionRule.allowPartialPass`

- <`boolean`>

Optional. If `true` and `passTest()` is present, instead of the entire value being discarded only the failing property will be discarded.

Note: This creates a new object of the same type as the option value is created **by calling its constructor**. Do not use this option if you do not know what that constructor does.

### `OptionRule.onWrongType(value)`

- `this` <`undefined`>
- `value` <`any`> Value of the option currently being evaluated.

Optional. Function called **if** type check fails, replacing the current option value and continuing evaluation. If not present, a type mismatch will instead dismiss the option. Called before final type check.

### `OptionRule.transformFn(value)`

- `this` <`undefined`>
- `value` <`any`> Value of the option currently being evaluated.

Optional. Transformation function whose return value replaces the current option value. This can be used to cast values to more appropriate types or formats. Called before final type check.

Note: This function is called after `onWrongType()`.

### `OptionRule.maxLength`

### `OptionRule.minLength`

- <`number`>

Optional. Only applies where `type` is `'string'`, `'object'`, `'function'`, or `'array'`. Discard the option if its `length` property is greater than `maxLength`, less than `minLength`, or if no numeric `length` property is present.

### `OptionRule.instance`

- <`object`> | <`Function`>

Optional. Only applies where `type` is `'object'` or `'function'`. Discard option if value is not an instance of `instance`.

### `OptionRule.max`

### `OptionRule.min`

- <`number`>

Optional. Only applies where `type` is `'number'` or `'bigint'`. Discard values greater than `max` and/or less than `min`.

### `OptionRule.notFloat`

- <`boolean`>

Optional. Only applies where `type` is `'number'`. Discard non-integer values.

### `OptionRule.notNaN`

- <`boolean`>

Optional. Only applies where `type` is `'number'`. Discard `NaN` values.

### `OptionRule.notInfinite`

- <`boolean`>

Optional. Only applies where `type` is `'number'`. Discard non-finite values (`Infinity`).

### `OptionRule.coerceType`

- <`boolean`>

Optional. Only applies where `type` is `'bigint'`, `'boolean'`, `'number'`, or `'string'`. If `true`, attempt to convert option value to the one specified in `type`. Type coercion is performed before the final type check.

#### Conversion to `bigint`

Values are convert to `BigInt` by first converting the value to a `Number` and then calling the `BigInt()` function with that value as its argument. If conversion is not possible the value becomes `null`.

#### Conversion to `boolean`

Truthy values are converted to `true`, the rest become `false`.

#### Conversion to `number`

Values of types other than `BigInt` and `Symbol` are converted to `Number`s by using the unary + operator. `BigInt` values are converted by calling the `Number()` constructor with the value as its argument. `Symbol` values are converted to `NaN`.

#### Conversion to `string`

Values are converted by performing string concatenation, with the exception of `Symbol` values which are converted by calling the `String()` constructor with the value as its argument.

Note: This occurs _before_ `onWrongType()` and `transformFn()` are called.

### `OptionRule.compactArrayLike`

- <`boolean`>

Optional. If `true`, remove any gaps resulting from a partial pass. Instances of `Array` and `TypedArray` are considered array-like.

Note: Has no effect if `allowPartialPass` is not `true`.

### `OptionRule.mapTo`

- <`string`>

Optional. Map option to a different property key in the output object.

### `OptionRule.macroTo`

- <`string`>

Optional. Use the rules of another option and map output accordingly. _All_ other options are discarded if set. If the referenced rule does not exist, a warning message will be printed and the option will be discarded.

### `OptionRule.reference`

- <`string`>

Optional. If set, inherits rules from the referenced rule if they're not set. If the referenced rule does not exist, a warning message will be printed and the option will be discarded. If the reference is circular a warning message is printed and the reference is ignored, but the rule is kept.

#### Example

```JavaScript
const decl = {
  options: {
    firstOption: {
      type: 'number',
      min: 0,
      max: 10,
      defaultValue: 5,
      coerceType: true
    },
    secondOption: {
      type: 'number',
      reference: 'firstOption',
      max: 11
    }
  }
}
```

In the example above `secondOption`, because itself does not have them, will inherit `min`, `defaultValue`, and `coerceType` from `firstOption`. After references have been resolved, `secondOption` is effectively equivallent to:

```JavaScript
const decl = {
  // ...
  secondOption: {
    type: 'number',
    min: 0,
    max: 11,
    defaultValue: 5,
    coerceType: true
  }
}
```

## `parseOptions(optDecl[, opts])`

### Parameters

**optDecl** <`OptionDeclaration`>\
Options declaration object. Contains property `options` and optionally the boolean `throwOnUnrecognized`. See index.d.ts for in-depth definition.

**opts** <`object`>\
Optional. Options object.

### Returns

- <`object`>

Parsed options object. Contains options with valid values or its default value if one was defined by `OptionRule.defaultValue`.

### Exceptions

- <`Error`> If `throwOnCircularError` is `true` and a macro rule or rule reference forms a circular reference.
- <`ReferenceError`> If `throwOnReferenceError` is `true` and a rule references a non-existent rule.
- <`Error`> If `throwOnUnrecognized` is `true` and an option not present in `optDecl.options` is found.
- If an option has `required` set to `true` and the associated option is either missing or invalid. The type of exception thrown is determined by the first failed criterion.

### Example

```TypeScript
  {
    options: {
      num: {
        type: 'number',
        min: 0,
        notNaN: true,
        defaultValue: 3
      },
      name: {
        type: 'string',
        minLength: 1,
        required: true
      }
    }
  }
```

In this example, the option `num` must be a `Number` greater than or equal to `0` and it must not be `NaN`. If it fails any of those tests, or is missing, it will still appear in the parsed options object, but with its default value of `3`. The option `name` **must** be present and it **must** be valid (`String` whose `length` is greater than or equal to `1`) or an exception will be raised due to `required` being `true`.

## Class: `OptionChecker`

Provides robust options checking. Uses `parseOptions` internally. A property is created on the instance where the parsed options variable is saved. The name of this property is either `options`, or the value of `OptionDeclaration.optVarName` when it is set.

## `OptionChecker()`

The `OptionChecker()` constructor returns a new `OptionChecker` instance.

### Parameters

See `parseOptions()`.
