/*
 * Remove any leading and trailing quotes (single and double) from a given string
 */
import { Type } from 'ts-morph';
import { GenericTypeMapping } from '../types';

export const INCLUDE_DOCS_JS_DOCS_PARAM = 'include-docs';
export const EXCLUDE_DOCS_JS_DOCS_PARAM = 'exclude-docs';
export const GROUP_DOCS_JS_DOCS_PARAM = 'group-docs';

export function stripQuotes(input: string): string {
	return input.replace(/^"|^'|"$|'$/g, '');
}

export function wrapInBraces(input: string): string {
	return '(' + input + ')';
}

export function wrapInCurlyBraces(input: string, inline: boolean): string {
	if (input.length === 0) {
		return '{}';
	} else if (inline) {
		return `{ ${input} }`;
	} else {
		return `{\n${input}\n}`;
	}
}

export function classWithIdString(componentName: string, id: number): string {
	return `${componentName}-${id}`;
}

// I do not want to include core-js as a dependency just to get the groupBy polyfill
export function groupBy<T>(
	entities: Map<string, T>,
	groupFn: (elem: T) => string,
): { [groupKey: string]: T[] } {
	const res: { [groupKey: string]: T[] } = {};
	for (const entity of entities.values()) {
		const groupKey = groupFn(entity);
		if (!res[groupKey]) {
			res[groupKey] = [];
		}
		res[groupKey].push(entity);
	}
	return res;
}

export function tryToReplaceTypeByGenericType(
	type: Type,
	genericMapping: GenericTypeMapping,
): Type {
	const symbol = type.getSymbol();
	if (!symbol) {
		return type;
	}
	const mappedType = genericMapping.get(symbol);
	if (mappedType) {
		return mappedType;
	}
	return type;
}
