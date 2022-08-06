/* eslint-disable */
// noinspection JSUnusedLocalSymbols

import { Directive, EventEmitter, Input } from "@angular/core";
import { TestInterface } from "./types";

interface X<T> {
    x: T;
}

@Directive()
export abstract class GrandParentDirective<T, S, R> {
    @Input() nestedGenericTypeParameterInput?: EventEmitter<EventEmitter<S>>;
}

@Directive()
export abstract class ParentDirective<T> extends GrandParentDirective<
    T,
    TestInterface<T>,
    string
> {
    @Input()
    set setterWithTupleElement(
        arr: Array<[string, number]> | ReadonlyArray<string>
    ) {}

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
        return "";
    }
}
