// These are ts-morph helper functions that are no publicly exported but should
// bet rather used to get insights/help during development.

import { Type, TypeFormatFlags } from 'ts-morph';

/**
 * Prints a type with all available formatters. This helps to understand what
 * each of them exactly does.
 */
export function logTypeWithAllFormatters(type: Type): void {
	const data = [];
	for (const name in TypeFormatFlags) {
		data.push({
			integerRepresentation: name,
			formattingOption: TypeFormatFlags[name],
			formattedType: type.getText(undefined, name as never),
		});
	}
	console.table(data);
}

/**
 * Creates a summary of a type.
 */
export function typeSummary(type: Type): object {
	const data = [];
	data.push({ check: 'isTypeParameter', result: type.isTypeParameter() });
	data.push({ check: 'isLiteral', result: type.isLiteral() });
	data.push({ check: 'isEnumLiteral', result: type.isEnumLiteral() });
	data.push({ check: 'isNumberLiteral', result: type.isNumberLiteral() });
	data.push({ check: 'isStringLiteral', result: type.isStringLiteral() });
	data.push({ check: 'isBooleanLiteral', result: type.isBooleanLiteral() });
	data.push({ check: 'isAnonymous', result: type.isAnonymous() });
	data.push({ check: 'isArray', result: type.isArray() });
	data.push({ check: 'isUndefined', result: type.isUndefined() });
	data.push({ check: 'isNull', result: type.isNull() });
	data.push({ check: 'isNullable', result: type.isNullable() });
	data.push({ check: 'isObject', result: type.isObject() });
	data.push({ check: 'isBoolean', result: type.isBoolean() });
	data.push({ check: 'isString', result: type.isString() });
	data.push({ check: 'isNumber', result: type.isNumber() });
	data.push({ check: 'isAny', result: type.isAny() });
	data.push({ check: 'isClass', result: type.isClass() });
	data.push({ check: 'isEnum', result: type.isEnum() });
	data.push({ check: 'isTuple', result: type.isTuple() });
	data.push({ check: 'isUnknown', result: type.isUnknown() });
	data.push({
		check: 'isClassOrInterface',
		result: type.isClassOrInterface(),
	});
	data.push({ check: 'isInterface', result: type.isInterface() });
	data.push({ check: 'isUnion', result: type.isUnion() });
	data.push({ check: 'isIntersection', result: type.isIntersection() });
	data.push({
		check: 'isUnionOrIntersection',
		result: type.isUnionOrIntersection(),
	});
	data.push({ check: 'Has a symbol', result: !!type.getSymbol() });
	data.push({ check: 'Has alias symbol', result: !!type.getAliasSymbol() });
	return data;
}
