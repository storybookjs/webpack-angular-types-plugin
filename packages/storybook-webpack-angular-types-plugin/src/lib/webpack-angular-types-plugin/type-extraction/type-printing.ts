import { Type, TypeFormatFlags } from 'ts-morph';
import { GenericTypeMapping, TypeDetailCollection } from '../../types';
import { tryToReplaceTypeByGenericType, wrapInBraces, wrapInCurlyBraces } from '../utils';
import {
	getTypeArgumentsFromType,
	isArray,
	isFunctionType,
	isInterface,
	isObjectType,
	isReadonlyArray,
} from './type-details';

/*
 * Given an array of type strings, it is searched if both the "true" and "false"
 * boolean literal types appear in the array. If so, they are replaced by "boolean"
 */
function replaceTrueFalseUnionByBooleanIfExists(union: string[]): string[] {
	// replace true/false by boolean
	let res = [...union];
	const trueIndex = res.indexOf('true');
	const falseIndex = res.indexOf('false');
	if (trueIndex > -1 && falseIndex > -1) {
		res = union.filter((elem, index) => index !== trueIndex && index !== falseIndex);
		res.push('boolean');
	}
	return res;
}

/*
 * Moves "undefined"/"null" to the end of the string array, if present
 */
function pushUndefinedAndNullToEnd(arr: string[]): string[] {
	const res = [...arr];
	const nullIndex = res.indexOf('null');
	if (nullIndex > -1) {
		res.splice(nullIndex, 1);
		res.push('null');
	}
	const undefinedIndex = res.indexOf('undefined');
	if (undefinedIndex > -1) {
		res.splice(undefinedIndex, 1);
		res.push('undefined');
	}
	return res;
}

/**
 * "Prints" a union or intersection by recursively following the parts of the
 * union or intersection type, while using the correct delimiter (& or |) to join
 * the evaluated result again.
 */
function printUnionOrIntersection(
	type: Type,
	expandType: boolean,
	level: number,
	mapping: GenericTypeMapping,
): string {
	if (!expandType && type.getAliasSymbol()) {
		return printAliasOrReference(type, expandType, level, mapping);
	}
	const types = type.isUnion() ? type.getUnionTypes() : type.getIntersectionTypes();
	const joinSymbol = type.isUnion() ? ' | ' : ' & ';
	let res = types.map((t) => printType(t, false, level + 1, mapping));
	// ts-morph evaluates the boolean type as a union type of boolean literals (true | false)
	// for printing, we want to display "boolean"
	res = replaceTrueFalseUnionByBooleanIfExists(res);
	res = pushUndefinedAndNullToEnd(res);
	const joinedRes = res.join(joinSymbol);
	return level > 0 ? wrapInBraces(joinedRes) : joinedRes;
}

/**
 * "Prints" an interface while recursively following all members of the interface.
 */
function printObject(
	type: Type,
	expandType: boolean,
	level: number,
	mapping: GenericTypeMapping,
): string {
	if (!expandType && type.getAliasSymbol()) {
		return printAliasOrReference(type, expandType, level, mapping);
	}
	const res: string[] = [];
	const inline = !expandType || level > 0;
	const indentation = inline ? '' : '   ';
	for (let i = 0; i < type.getProperties().length; i++) {
		const propName = type.getProperties()[i].getName();
		const propType = type.getProperties()[i].getValueDeclaration()?.getType();
		if (!propType) {
			continue;
		}
		// the whitespaces at the beginning are for indentation
		res.push(`${indentation}${propName}: ${printType(propType, false, level, mapping)}`);
	}

	const joinBy = !inline ? ',\n' : ', ';
	return wrapInCurlyBraces(res.join(joinBy), inline);
}

function printInterface(
	type: Type,
	expandType: boolean,
	level: number,
	mapping: GenericTypeMapping,
): string {
	if (!expandType) {
		return printAliasOrReference(type, expandType, level, mapping);
	}
	const res: string[] = [];
	for (const property of type.getProperties()) {
		const propName = property.getName();
		const propType = property.getValueDeclarationOrThrow().getType();
		res.push(`  ${propName}: ${printType(propType, false, level, mapping)};`);
	}
	return wrapInCurlyBraces(res.join('\n'), false);
}

function printFunction(
	type: Type,
	expandType: boolean,
	level: number,
	mapping: GenericTypeMapping,
): string {
	if (!expandType && type.getAliasSymbol()) {
		return printAliasOrReference(type, expandType, level, mapping);
	}
	const signatures = type.getCallSignatures();
	const res: string[] = [];
	for (const callSignature of signatures) {
		const retTypeString = printType(callSignature.getReturnType(), false, level, mapping);
		const paramStrings: string[] = [];
		for (const param of callSignature.getParameters()) {
			const paramName = param.getName();
			const paramType = printType(
				param.getValueDeclaration()?.getType() || param.getDeclaredType(),
				false,
				level,
				mapping,
			);
			const paramString = `${paramName}: ${paramType}`;
			paramStrings.push(paramString);
		}
		const signatureString = `(${paramStrings.join(', ')}): ${retTypeString};`;
		res.push(signatureString);
	}
	// TODO new line is currently ignored by ArgsTable, find workaround
	return res.join('\n');
}

function printTuple(
	type: Type,
	expandType: boolean,
	level: number,
	mapping: GenericTypeMapping,
): string {
	if (!expandType && type.getAliasSymbol()) {
		return printAliasOrReference(type, expandType, level, mapping);
	}
	return '[' + type.getTupleElements().map((te) => printType(te, false, level, mapping)) + ']';
}

function getTypeWithoutTypeArguments(type: Type, typeText: string): string {
	// we need special handling for arrays and readonly arrays to always
	// parse them correctly
	if (isArray(type)) {
		return 'Array';
	} else if (isReadonlyArray(type)) {
		return 'ReadonlyArray';
	} else {
		return typeText.substring(0, Math.max(typeText.indexOf('<'), 0));
	}
}

function printAliasOrReference(
	type: Type,
	expandType: boolean,
	level: number,
	mapping: GenericTypeMapping,
): string {
	const typeArguments = getTypeArgumentsFromType(type);
	const typeText = type.getText(undefined, TypeFormatFlags.None);

	// the type has no type arguments, it can just be returned
	if (typeArguments.length === 0 || type.isTuple()) {
		return typeText;
	}

	const typeTextWithoutArguments = getTypeWithoutTypeArguments(type, typeText);

	// if type parameters are present, we have to follow them recursively, since
	// they could have nested type parameters itself
	const mappedArguments = typeArguments
		.map((arg) => printType(arg, false, 0, mapping))
		.join(', ');
	return typeTextWithoutArguments + '<' + mappedArguments + '>';
}

/*
 * Gets a printable string from a type.
 */
export function printType(
	typeToPrint: Type,
	expandType: boolean,
	level: number,
	mapping: GenericTypeMapping = new WeakMap(),
): string {
	const type = tryToReplaceTypeByGenericType(typeToPrint, mapping);
	if (type.isUnionOrIntersection()) {
		return printUnionOrIntersection(type, expandType, level, mapping);
	} else if (type.isTuple()) {
		return printTuple(type, expandType, level, mapping);
	} else if (isInterface(type)) {
		return printInterface(type, expandType, level, mapping);
	} else if (isObjectType(type)) {
		return printObject(type, expandType, level, mapping);
	} else if (isFunctionType(type)) {
		return printFunction(type, expandType, level, mapping);
	} else {
		return printAliasOrReference(type, expandType, level, mapping);
	}
}

/*
 * Stringifies a given typeDetailCollection
 */
export function stringifyTypeDetailCollection(
	typeDetailCollection: TypeDetailCollection,
): string | undefined {
	if (typeDetailCollection.size === 0) {
		return undefined;
	}
	let result = '';
	for (const { type, typeName, detailString } of typeDetailCollection.values()) {
		// type-aliases need some special output formatting since it is "type <type-alias-name> = <type>"
		// in all other cases, we simply print <type> <type-name> <type-declaration>
		if (type === 'type') {
			result += `type ${typeName} = ${detailString};\n\n`;
		} else {
			result += `${type} ${typeName} ${detailString}\n\n`;
		}
	}
	return result;
}
