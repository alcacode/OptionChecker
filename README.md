# option_checker

Provides the abstract class OptionChecker which provides robust options checking.

## `parseOptions()`

### Parameters

**optDecl** <`OptionDeclaration`>\
Options declaration object. Contains property `options` and optionally the boolean `throwOnUnrecognized`. See index.d.ts for in-depth definition.

```TypeScript
  {
    throwOnUnrecognized?: boolean;
    options: {
      optionName1: {
        type: 'object' | 'function' | 'number' | 'bigint' | 'string' | 'undefined' | 'boolean' | 'symbol' | 'array';
        required?: boolean;
        passFull?: boolean;
        allowPartial?: boolean;
        notFloat?: boolean;
        notNaN?: boolean;
        notInfinite?: boolean;
        defaultValue?: any;
        maxLength?: number;
        minLength?: number;
        max?: number;
        min?: number;
        instance?: new(...args: any[]) => any;
        passTest?: (arg: any) => boolean;
        typeTransformFn?: (arg: any) => T;
        valueTransformFn?: (arg: any) => T;
      }
    }
  }
```

**opts** <`object`>\
Options object.

### Returns

Parsed options `Object`.

## Class: `OptionChecker`

Provides robust options checking. Uses `parseOptions` internally.

### `OptionChecker.options`

Parsed options `Object`.

## `OptionChecker()`

The `OptionChecker()` constructor returns a new `OptionChecker` instance.

### Parameters

Same as `parseOptions()`.
