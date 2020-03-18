# option_checker

Provides the class `OptionChecker` and `parseOptions()` which provides robust options checking.

- [option_checker](#optionchecker)
  - [The `OptionDeclaration` Object](#the-optiondeclaration-object)
    - [`OptionDeclaration.throwOnUnrecognized`](#optiondeclarationthrowonunrecognized)
    - [`OptionDeclaration.optVarName`](#optiondeclarationoptvarname)
    - [`OptionDeclaration.options`](#optiondeclarationoptions)
  - [The `OptionRule` Object](#the-optionrule-object)
    - [**`OptionRule.type`**](#optionruletype)
    - [`OptionRule.required`](#optionrulerequired)
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
  - [`parseOptions(optDecl[, opts])`](#parseoptionsoptdecl-opts)
    - [Parameters](#parameters)
    - [Returns](#returns)
    - [Exceptions](#exceptions)
    - [Example](#example)
  - [Class: `OptionChecker`](#class-optionchecker)
  - [`OptionChecker()`](#optionchecker-1)
    - [Parameters](#parameters-1)

## The `OptionDeclaration` Object

The options declaration object is used to declare the requirements of applicable to options and to tweak the behavior of `parseOptions()`.

### `OptionDeclaration.throwOnUnrecognized`

- <`boolean`>

Optional. If `true`, causes any provided option not present in `OptionDeclaration.options` to throw an exception. Default: `false`.

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

Required. Case insensitive. One of `'object'`, `'function'`, `'number'`, `'bigint'`, `'string'`, `'undefined'`, `'boolean'`, `'symbol'`, `'array'`, or `'null'`.

Note: Although the option value is tested against the specified type, there are multiple ways of converting said value to an appropriate type. What it really means is that the _resulting value_ of any conversion attempts must adhere to the specified type.

### `OptionRule.required`

- <`boolean`>

Optional. If `true` an exception will be thrown if the option is missing or its value is invalid.

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

Optional. Only applies where `type` is `'object'`, `'function'`, or `'array'`. Discard option if value is not an instance of `instance`.

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
