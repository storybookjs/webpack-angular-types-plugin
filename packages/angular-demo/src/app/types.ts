export type TestType =
	| string
	| number
	| boolean
	| object
	| undefined
	| { a: number; b: number }
	| (NestedInterface & { [val: string]: IndexSignatureInterface });

export interface TestInterface<T> {
	a?: string;
	b?: number;
	c?: object;
	d?: boolean;
	e?: NestedInterface;
	f?: T;
}

export interface NestedInterface {
	prop1: string;
	prop2: string;
}

export interface IndexSignatureInterface {
	prop3: string;
}

export type TestObjectType<T> = {
	x: number;
	y: number;
	z: T;
	nestedObjectType: NestedTestObjectType<T>;
};

export type NestedTestObjectType<T> = { typeFromGrandparent: T };

export class TestClass {}
