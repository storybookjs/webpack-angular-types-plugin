// These are ts-morph helper functions that are no publicly exported but should
// bet rather used to get insights/help during development.

import { ModuleKind, ModuleResolutionKind, ScriptTarget, Type, TypeFormatFlags } from 'ts-morph';

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

export function parseModuleKind(moduleString: string | undefined): ModuleKind {
	switch (moduleString?.toLowerCase()) {
		case 'commonjs':
			return ModuleKind.CommonJS;
		case 'amd':
			return ModuleKind.AMD;
		case 'umd':
			return ModuleKind.UMD;
		case 'system':
			return ModuleKind.System;
		case 'es6':
		case 'es2015':
			return ModuleKind.ES2015;
		case 'es2020':
			return ModuleKind.ES2020;
		case 'es2022':
			return ModuleKind.ES2022;
		case 'esnext':
			return ModuleKind.ESNext;
		case 'node16':
			return ModuleKind.Node16;
		case 'nodenext':
			return ModuleKind.NodeNext;
		default:
			console.warn(
				`[WebpackAngularTypesPlugin]: Invalid or unknown "compilerOptions.module" retrieved from tsconfig: ${moduleString}. Defaulting to "es2020".`,
			);
			return ModuleKind.ES2020;
	}
}
export function parseScriptTarget(targetString: string | undefined): ScriptTarget {
	switch (targetString?.toLowerCase()) {
		case 'es3':
			return ScriptTarget.ES3;
		case 'es5':
			return ScriptTarget.ES5;
		case 'es6':
		case 'es2015':
			return ScriptTarget.ES2015;
		case 'es2016':
			return ScriptTarget.ES2016;
		case 'es2017':
			return ScriptTarget.ES2017;
		case 'es2018':
			return ScriptTarget.ES2018;
		case 'es2019':
			return ScriptTarget.ES2019;
		case 'es2020':
			return ScriptTarget.ES2020;
		case 'es2021':
			return ScriptTarget.ES2021;
		case 'es2022':
			return ScriptTarget.ES2022;
		case 'esnext':
			return ScriptTarget.ESNext;
		default:
			console.warn(`
				[WebpackAngularTypesPlugin]: Invalid or unknown "compilerOptions.target" retrieved from tsconfig: ${targetString}. Defaulting to "esnext".
			`);
			return ScriptTarget.ESNext;
	}
}

export function parseModuleResolution(
	moduleResolutionString: string | undefined,
): ModuleResolutionKind {
	switch (moduleResolutionString?.toLowerCase()) {
		case 'classic':
			return ModuleResolutionKind.Classic;
		case 'node':
		case 'nodejs':
			return ModuleResolutionKind.NodeJs;
		case 'node16':
			return ModuleResolutionKind.Node16;
		case 'nodenext':
			return ModuleResolutionKind.NodeNext;
		case 'bundler':
			return ModuleResolutionKind.Bundler;
		default:
			console.warn(
				`[WebpackAngularTypesPlugin]: Invalid or unknown "compilerOptions.moduleResolution" retrieved from tsconfig: ${moduleResolutionString}. Defaulting to "nodejs".`,
			);
			return ModuleResolutionKind.NodeJs;
	}
}
