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

declare type typeRetVal<T> = T extends string ? (
	T extends 'number' ? number :
	T extends 'int' ? number :
	T extends 'string' ? string :
	T extends 'object' ? object :
	T extends 'array' ? any[] :
	T extends 'bigint' ? BigInt :
	T extends 'symbol' ? symbol :
	T extends 'undefined' ? undefined :
	T extends 'null' ? null :
	T extends 'arraylike' ? ArrayLike<any> :
	T extends 'any' ? any :
	T extends 'boolean' ? boolean :
	T extends 'function' ? (...args: any[]) => any :
	any
) : unknown;