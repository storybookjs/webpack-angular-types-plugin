import { Directive, input, output } from '@angular/core';

@Directive({})
export abstract class GreatGrandParentDirective {
	/**
	 * An input from a Directive imported from a path alias
	 */
	libInput = input<string>();

	/**
	 * An output from a Directive imported from a path alias
	 */
	libOutput = output<string>();

	/**
	 * A property from a Directive imported from a path alias
	 */
	libProperty = 42;
}
