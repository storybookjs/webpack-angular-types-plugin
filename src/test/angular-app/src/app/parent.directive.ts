import { Directive, Input } from "@angular/core";

@Directive()
export abstract class ParentDirective {
    /**
     * This is an input in the parent directive. It should also be
     * visible in the docs of child classes
     */
    @Input() parentInput?: string;
}
