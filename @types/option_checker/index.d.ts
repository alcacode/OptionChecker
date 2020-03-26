/// <reference path="../../src/index.d.ts" />
export declare function parseOptions<O extends {
    [key: string]: any;
}>(optDecl: OptionDeclaration<O>, opts?: {
    [key: string]: any;
}): OptionList<Partial<O>>;
export declare const OptionChecker: OptionCheckerConstructor;
