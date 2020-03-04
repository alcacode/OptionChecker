/// <reference types="src" />
export declare function parseOptions(optDecl: OptionDeclaration, opts?: {
    [key: string]: any;
}): {
    [key: string]: any;
};
export declare abstract class OptionChecker {
    options: {
        [key: string]: any;
    };
    constructor(optDecl: OptionDeclaration, options?: {
        [key: string]: any;
    });
}
