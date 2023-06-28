import { Pipe, PipeTransform } from '@angular/core';

/*
 * Raise the value exponentially
 * Takes an exponent argument that defaults to 1.
 * Usage:
 *   value | exponentialStrength:exponent
 * Example:
 *   {{ 2 | exponentialStrength:10 }}
 *   formats to: 1024
 */
@Pipe({ name: 'example' })
export class ExamplePipe implements PipeTransform {
	/**
	 * Takes a value and an (optional) exponent and raises the value to the given exponent.
	 * @param value the value to raise exponentially
	 * @param exponent the given exponent. Defaults to `1`.
	 */
	transform(value: number, exponent = 1): number {
		return Math.pow(value, exponent);
	}
}
