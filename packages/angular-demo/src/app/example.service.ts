/* eslint-disable */
// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols,JSMethodCanBeStatic

import { Injectable, OnDestroy } from '@angular/core';
import { NestedInterface, TestInterface, TestType } from './internal-types';

@Injectable()
export class ExampleService implements OnDestroy {
	/**
	 * Uninitialized value of string | undefined type.
	 */
	valueOrUndefined: string | undefined;

	/**
	 * Optional, uninitialized of string type.
	 */
	valueOrOptional?: string;

	/**
	 * Value initialized with string literal and implicit type.
	 */
	stringValue = '';

	/**
	 * Value initialized with boolean literal and implicit type.
	 */
	booleanValue = true;

	/**
	 * Value initialized with boolean literal and explicit type.
	 */
	booleanValueTyped: boolean = true;

	/**
	 * Value initialized with number literal and explicit type.
	 */
	numberValue = 10;

	/**
	 * Value initialized with object literal and implicit (any) type.
	 */
	objectValue = {};

	focusEvent?: FocusEvent;

	/**
	 * Uninitialized value of type function or undefined.
	 */
	functionValue: ((p1: string, p2: TestType, p3: NestedInterface) => string) | undefined;

	/**
	 * Value initialized with string literal. The explicit type is an alias
	 * for a union. In the description only "TestType" should be printed.
	 * In the details, the alias should be expanded to the union.
	 */
	valueWithType: TestType = '';

	/**
	 * Value initialized with an object literal. The explicit type is an interface.
	 * In the description only "TestInterface" should be printed. In the details,
	 * the interface should be expanded with its properties.
	 */
	valueWithInterface: TestInterface<string> = {};

	// Should not be included in the resulting types
	private privateValue: string = 'test';

	// Should not be included in the resulting types
	protected protectedValue: string = 'test';

	/**
	 * A setter. The type "string" should be picked from the parameters.
	 */
	set stringSetter(value: string) {}

	/**
	 *  A getter. The type "string" should be picked implicitly from the return value.
	 */
	get stringGetter() {
		return '';
	}

	/**
	 * This is some normal setter with a defaultValue override
	 * @default "someValue2"
	 */
	set someNormalSetter(test: string) {}

	_val = 1;

	/**
	 * A setter that also has a respective getter
	 * @default 1
	 */
	set bothSetterAndGetter(val: number) {
		this._val = val;
	}

	get bothSetterAndGetter() {
		return this._val;
	}

	ngOnDestroy() {}

	/**
	 * Public method with parameter and return value description
	 * @param valA The first parameter of this function
	 * @param valB The second parameter of this function
	 * @return Returns the empty string in all cases.
	 */
	public publicMethod(valA: string, valB: string): string {
		return '';
	}

	private privateMethod(val: string): string {
		return '';
	}
}
