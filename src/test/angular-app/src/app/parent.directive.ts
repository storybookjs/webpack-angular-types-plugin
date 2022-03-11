import { Directive, Input } from "@angular/core";

@Directive()
export abstract class ParentDirective {
    @Input() parentInput?: string;
}
