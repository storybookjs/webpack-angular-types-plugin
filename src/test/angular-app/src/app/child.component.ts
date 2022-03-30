import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ParentDirective } from "./parent.directive";

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

@Component({
    selector: "app-child",
    template: `Child works`,
})
export class ChildComponent extends ParentDirective {
    valueOrUndefined: string | undefined;
    valueOrOptional?: string;

    stringValue = "";
    booleanValue = true;
    booleanValueTyped: boolean = true;
    numberValue = 10;
    objectValue = {};

    functionValue:
        | ((p1: string, p2: TestType, p3: NestedInterface) => string)
        | undefined;

    /**
     * Should this render
     *      string | number | boolean | object | undefined;
     *  to ArgsTable?
     */
    valueWithType: TestType = "";

    /**
     * Should we add interfaces to the types so it is possible to do
     * ArgsTable of={TestInterface}
     */
    valueWithInterface: TestInterface = {};

    set stringSetter(value: string) {}

    /**
     *  should this be rendered to ArgsTable? it does not right now
     */
    get stringGetter() {
        return "";
    }

    /**
     * This is a description for valueWithComments
     */
    valueWithComments = "";

    /**
     * This is a child input
     */
    @Input() childInput?: string = "defaultValue2";
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("childInputWithAlias") childInput2?: string;

    @Output() testOutput3 = new EventEmitter<string>();

    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("setterInputWithAlias")
    set setterInput(value: boolean) {}

    someNormalProperty = "";

    set someNormalSetter(test: string) {}

    constructor() {
        super();
    }
}
