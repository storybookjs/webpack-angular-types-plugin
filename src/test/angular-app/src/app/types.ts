export type TestType =
    | string
    | number
    | boolean
    | object
    | undefined
    | (NestedInterface & { [val: string]: IndexSignatureInterface });

export interface TestInterface {
    a?: string;
    b?: number;
    c?: object;
    d?: boolean;
    e?: NestedInterface;
}

export interface NestedInterface {
    prop1: string;
    prop2: string;
}

export interface IndexSignatureInterface {
    prop3: string;
}
