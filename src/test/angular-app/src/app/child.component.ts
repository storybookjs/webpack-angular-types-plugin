import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ParentDirective } from "./parent.directive";

@Component({
    selector: "app-child",
    template: `Child works`,
})
export class ChildComponent extends ParentDirective {
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
