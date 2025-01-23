import {
	FunctionDeclaration,
	GetAccessorDeclaration,
	MethodDeclaration,
	PropertyDeclaration,
	SetAccessorDeclaration,
	VariableStatement,
} from 'ts-morph';
import {
	Entity,
	EntityKind,
	DeclarationToEntityMappingParams,
	TsMorphSymbol,
	TypeDetail,
} from '../../types';
import {
	getDefaultValue,
	getJsDocsDefaultValue,
	getJsDocsDescription,
	getJsDocsParams,
	getJsDocsReturnDescription,
	getVariableInitializerValue,
	getVariableName,
	isTypeRequired,
	getAlias,
} from './ast-utils';
import { generateTypeDetailCollection } from './type-details';
import { printType, stringifyTypeDetailCollection } from './type-printing';
import { isInputSignal, isModelSignal, isOutputRef } from './utils';

function getDeclarationKind(
	declaration:
		| PropertyDeclaration
		| SetAccessorDeclaration
		| GetAccessorDeclaration
		| MethodDeclaration,
): EntityKind {
	if (declaration.getDecorator('Input')) {
		return 'input';
	} else if (declaration.getDecorator('Output')) {
		return 'output';
	} else if (declaration instanceof MethodDeclaration) {
		return 'method';
	} else {
		return 'property';
	}
}

export function mapDeclarationToEntities(params: DeclarationToEntityMappingParams): Entity[] {
	if (params.declaration instanceof PropertyDeclaration) {
		const propertyEntity = mapPropertyDeclaration(params);

		if (isInputSignal(params.declaration)) {
			return [
				{
					...propertyEntity,
					kind: 'input',
				},
			];
		} else if (isOutputRef(params.declaration)) {
			return [
				{
					...propertyEntity,
					kind: 'output',
				},
			];
		} else if (isModelSignal(params.declaration)) {
			// A model() signal is equivalent to an input and output signal. That's why we create
			// two entities from that to list it under both "inputs" and "outputs" section in the ArgsTable.
			return [
				{
					...propertyEntity,
					kind: 'input',
				},
				{
					...propertyEntity,
					name: propertyEntity.name + 'Change',
					kind: 'output',
					defaultValue: undefined,
				},
			];
		} else {
			return [propertyEntity];
		}
	} else if (params.declaration instanceof SetAccessorDeclaration) {
		return [mapSetAccessorDeclaration(params)];
	} else if (params.declaration instanceof GetAccessorDeclaration) {
		return [mapGetAccessorDeclaration(params)];
	} else {
		return [mapMethodDeclaration(params)];
	}
}

/*
 * Maps a ts-morph property declaration to our internal Property type
 */
export function mapPropertyDeclaration({
	declaration,
	genericTypeMapping,
}: DeclarationToEntityMappingParams): Entity {
	return {
		kind: getDeclarationKind(declaration),
		alias: getAlias(declaration),
		name: declaration.getName(),
		defaultValue: getDefaultValue(declaration as PropertyDeclaration),
		description: getJsDocsDescription(declaration) || '',
		type: printType(declaration.getType(), false, 0, genericTypeMapping),
		typeDetails: stringifyTypeDetailCollection(
			generateTypeDetailCollection(
				declaration.getType(),
				new Map<TsMorphSymbol, TypeDetail>(),
				0,
				genericTypeMapping,
			),
		),
		required: isTypeRequired(declaration.getType()),
	};
}

/*
 * Maps a ts-morph set accessor declaration to our internal Property type
 */
export function mapSetAccessorDeclaration({
	declaration,
	genericTypeMapping,
}: DeclarationToEntityMappingParams): Entity {
	const setAccessorDeclaration = declaration as SetAccessorDeclaration;
	const parameters = setAccessorDeclaration.getParameters();
	const parameter = parameters.length === 1 ? parameters[0] : undefined;
	if (!parameter) {
		throw new Error('Invalid number of arguments for set accessor.');
	}
	return {
		kind: getDeclarationKind(setAccessorDeclaration),
		alias: getAlias(setAccessorDeclaration),
		name: setAccessorDeclaration.getName(),
		// accessors can not have a default value
		defaultValue: getDefaultValue(setAccessorDeclaration),
		description: getJsDocsDescription(setAccessorDeclaration) || '',
		type: printType(parameter.getType(), false, 0, genericTypeMapping),
		typeDetails: stringifyTypeDetailCollection(
			generateTypeDetailCollection(
				parameter.getType(),
				new Map<TsMorphSymbol, TypeDetail>(),
				0,
				genericTypeMapping,
			),
		),
		required: isTypeRequired(parameter.getType()),
		modifier: 'setter',
	};
}

/*
 * Maps a ts-morph get accessor declaration to our internal Property type
 */
export function mapGetAccessorDeclaration({
	declaration,
	genericTypeMapping,
}: DeclarationToEntityMappingParams): Entity {
	const getAccessorDeclaration = declaration as GetAccessorDeclaration;
	return {
		kind: getDeclarationKind(getAccessorDeclaration),
		alias: getAlias(getAccessorDeclaration),
		name: getAccessorDeclaration.getName(),
		// accessors can not have a default value
		defaultValue: undefined,
		description: getJsDocsDescription(getAccessorDeclaration) || '',
		type: printType(getAccessorDeclaration.getType(), false, 0, genericTypeMapping),
		typeDetails: stringifyTypeDetailCollection(
			generateTypeDetailCollection(
				getAccessorDeclaration.getType(),
				new Map<TsMorphSymbol, TypeDetail>(),
				0,
				genericTypeMapping,
			),
		),
		required: false,
		modifier: 'getter',
	};
}

export function mapMethodDeclaration({
	declaration,
	genericTypeMapping,
}: DeclarationToEntityMappingParams): Entity {
	const methodDeclaration = declaration as MethodDeclaration;
	return {
		kind: getDeclarationKind(methodDeclaration),
		alias: undefined,
		name: methodDeclaration.getName(),
		defaultValue: undefined,
		description: getJsDocsDescription(methodDeclaration) || '',
		jsDocParams: getJsDocsParams(methodDeclaration),
		jsDocReturn: getJsDocsReturnDescription(methodDeclaration),
		type:
			methodDeclaration.getName() +
			printType(methodDeclaration.getType(), false, 0, genericTypeMapping),
		typeDetails: undefined,
		required: false,
	};
}

export function mapFunctionDeclaration(functionDeclaration: FunctionDeclaration): Entity {
	return {
		kind: 'method',
		alias: undefined,
		name: functionDeclaration.getName() || '',
		defaultValue: getJsDocsDefaultValue(functionDeclaration),
		description: getJsDocsDescription(functionDeclaration) || '',
		jsDocParams: getJsDocsParams(functionDeclaration),
		jsDocReturn: getJsDocsReturnDescription(functionDeclaration),
		type: functionDeclaration.getName() + printType(functionDeclaration.getType(), false, 0),
		typeDetails: undefined,
		required: false,
	};
}

export function mapVariableDeclaration(variableStatement: VariableStatement): Entity {
	return {
		kind: 'property',
		alias: undefined,
		name: getVariableName(variableStatement),
		defaultValue:
			getJsDocsDefaultValue(variableStatement) ??
			getVariableInitializerValue(variableStatement),
		description: getJsDocsDescription(variableStatement) || '',
		jsDocParams: getJsDocsParams(variableStatement),
		jsDocReturn: getJsDocsReturnDescription(variableStatement),
		type: printType(variableStatement.getType(), false, 0),
		typeDetails: undefined,
		required: false,
	};
}
