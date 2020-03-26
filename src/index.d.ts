declare type TypedArrayInstance =
        (Int8Array|Int16Array|Int32Array|BigInt64Array|Uint8Array|
                Uint8ClampedArray|Uint16Array|Uint32Array|BigUint64Array|
                Float32Array|Float64Array);

declare interface ArrayLike<T>{
        [Symbol.iterator](): IterableIterator<T>
}

declare interface Uint8Array {
        __proto__: { constructor: Function }
}