export function parseOptions<O extends {
        [key: string]: any;
    }>(optDecl: OptionDeclaration<O>, opts?: {
        [key: string]: any;
    }): OptionList<Partial<O>>;

export const OptionChecker: OptionCheckerConstructor;