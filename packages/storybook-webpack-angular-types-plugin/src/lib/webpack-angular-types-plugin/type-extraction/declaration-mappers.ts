import {
	GetAccessorDeclaration,
	MethodDeclaration,
	PropertyDeclaration,
	SetAccessorDeclaration,
} from 'ts-morph';
import { Entity, EntityKind, EntityMappingParams, TsMorphSymbol, TypeDetail } from '../../types';
import {
	getDefaultValue,
	getJsDocsDescription,
	getJsDocsParams,
	getJsDocsReturnDescription,
	isTypeRequired,
	retrieveInputOutputDecoratorAlias,
} from './ast-utils';
import { generateTypeDetailCollection } from './type-details';
import { printType, stringifyTypeDetailCollection } from './type-printing';

function getEntityKind(
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

export function mapToEntity(params: EntityMappingParams): Entity {
	if (params.declaration instanceof PropertyDeclaration) {
		return mapProperty(params);
	} else if (params.declaration instanceof SetAccessorDeclaration) {
		return mapSetAccessor(params);
	} else if (params.declaration instanceof GetAccessorDeclaration) {
		return mapGetAccessor(params);
	} else {
		return mapMethod(params);
	}
}

/*
 * Maps a ts-morph property declaration to our internal Property type
 */
export function mapProperty({ declaration, genericTypeMapping }: EntityMappingParams): Entity {
	return {
		kind: getEntityKind(declaration),
		alias: retrieveInputOutputDecoratorAlias(declaration),
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
export function mapSetAccessor({ declaration, genericTypeMapping }: EntityMappingParams): Entity {
	const setAccessorDeclaration = declaration as SetAccessorDeclaration;
	const parameters = setAccessorDeclaration.getParameters();
	const parameter = parameters.length === 1 ? parameters[0] : undefined;
	if (!parameter) {
		throw new Error('Invalid number of arguments for set accessor.');
	}
	return {
		kind: getEntityKind(setAccessorDeclaration),
		alias: retrieveInputOutputDecoratorAlias(setAccessorDeclaration),
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
export function mapGetAccessor({ declaration, genericTypeMapping }: EntityMappingParams): Entity {
	const getAccessorDeclaration = declaration as GetAccessorDeclaration;
	return {
		kind: getEntityKind(getAccessorDeclaration),
		alias: retrieveInputOutputDecoratorAlias(getAccessorDeclaration),
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

export function mapMethod({ declaration, genericTypeMapping }: EntityMappingParams): Entity {
	const methodDeclaration = declaration as MethodDeclaration;
	return {
		kind: getEntityKind(methodDeclaration),
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
