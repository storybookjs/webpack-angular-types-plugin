import {
	FunctionDeclaration,
	GetAccessorDeclaration,
	MethodDeclaration,
	PropertyDeclaration,
	SetAccessorDeclaration,
	VariableStatement,
	Node,
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
import {
	printInputType,
	printOutputType,
	printType,
	stringifyTypeDetailCollection,
} from './type-printing';
import { isInputSignal, isModelSignal, isOutputRef } from './angular-utils';

function getDeclarationKind(declaration: PropertyDeclaration): EntityKind | 'model';
function getDeclarationKind(
	declaration: SetAccessorDeclaration | GetAccessorDeclaration | MethodDeclaration,
): EntityKind;
function getDeclarationKind(
	declaration:
		| PropertyDeclaration
		| SetAccessorDeclaration
		| GetAccessorDeclaration
		| MethodDeclaration,
): EntityKind | 'model' {
	if (Node.isPropertyDeclaration(declaration)) {
		if (isInputSignal(declaration)) {
			return 'input';
		} else if (isModelSignal(declaration)) {
			return 'model';
		} else if (isOutputRef(declaration)) {
			return 'output';
		}
	}
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
		return mapPropertyDeclaration(
			params as DeclarationToEntityMappingParams<PropertyDeclaration>,
		);
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
}: DeclarationToEntityMappingParams<PropertyDeclaration>): Entity[] {
	const kind = getDeclarationKind(declaration);
	const type = printType(declaration.getType(), false, 0, genericTypeMapping);

	const baseEntity: Omit<Entity, 'kind' | 'type'> = {
		alias: getAlias(declaration),
		name: declaration.getName(),
		defaultValue: getDefaultValue(declaration as PropertyDeclaration),
		description: getJsDocsDescription(declaration) || '',
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

	if (kind === 'input') {
		return [
			{
				...baseEntity,
				kind: 'input',
				type: printInputType(type),
			},
		];
	} else if (kind === 'output') {
		return [
			{
				...baseEntity,
				kind: 'output',
				type: printOutputType(type),
			},
		];
	} else if (kind === 'model') {
		return [
			{
				...baseEntity,
				kind: 'input',
				type: printInputType(type),
			},
			{
				...baseEntity,
				name: baseEntity.name + 'Change',
				kind: 'output',
				type: printOutputType(type),
				defaultValue: undefined,
			},
		];
	}
	return [
		{
			...baseEntity,
			kind,
			type,
		},
	];
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
