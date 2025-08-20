/* eslint-disable */
// noinspection JSUnusedLocalSymbols

import { Directive, EventEmitter, Input } from '@angular/core';
import { TestInterface } from './internal-types';
import { GreatGrandParentDirective } from '@scope/entrypoint';

interface X<T> {
	x: T;
}

@Directive()
export abstract class GrandParentDirective<T, S, R> extends GreatGrandParentDirective {
	@Input() nestedGenericTypeParameterInput?: EventEmitter<EventEmitter<S>>;
}

@Directive()
export abstract class ParentDirective<T> extends GrandParentDirective<T, TestInterface<T>, string> {
	@Input()
	set setterWithTupleElement(arr: Array<[string, number]> | ReadonlyArray<string>) {}

	@Input() test?: X<T>;
	/**
	 * This is an input in the parent directive. It should also be
	 * visible in the docs of child classes
	 */
	@Input() parentInput?: string;

	/**
	 * This is a setter input in the parent directive. It should also be
	 * visible in the docs of child classes
	 * @default "someValue"
	 */
	@Input()
	set parentSetterInput(value: T[]) {}
	get parentSetterInput() {
		return [];
	}

	/**
	 * This is a generic input that should get the correct type, if a subclass
	 * defines it
	 */
	@Input() genericInput?: T | number;

	@Input() genericTypeParameterInput?: EventEmitter<T>;

	@Input() literalGenericObjectInput?: { literalX: T };

	@Input() inputWithoutExplicitType = 4;

	/**
	 * This is some method with a generic parameter
	 * @param value The value of this function
	 * @return Always the empty string.
	 */
	public methodWithGeneric(value: T): string {
		return '';
	}

	/**
	 * This method is overloaded.
	 *
	 * @param param
	 */
	overloadedMethod(param: string): string;
	overloadedMethod(param: string, optionalParam: string | null): string;
	overloadedMethod(param: string, optionalParam: string | undefined): string;
	overloadedMethod(param: string, optionalParam?: string | null | undefined): string {
		return String(param);
	}

	/**
	 * Should not show this
	 */
	propertyWithChildClassOverride = 'This is the base class default';

	/**
	 * Should not show this
	 *
	 * @exclude-docs
	 */
	propertyExcludedInBaseClass = 'This is the base class default';

	/**
	 * This is a property that is excluded from the docs in the child class, but not in the base class.
	 */
	propertyExcludedInChildClass = 'This is the base class default';

	/**
	 * Should not show this at all
	 *
	 * @exclude-docs
	 */
	propertyExcludedInBaseAndChildClass = 'This is the base class default';
}
