/// <reference types="src" />
export declare function parseOptions<O extends OptionList<any>>(optDecl: OptionDeclaration<O>, opts?: {
    [key: string]: any;
}): OptionList<O>;
export declare const OptionChecker: OptionCheckerConstructor;
