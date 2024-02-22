import { Symbol as TsMorphSymbol, Type } from 'ts-morph';
import { GenericTypeMapping, TypeDetail, TypeDetailCollection, TypeKind } from '../../types';
import { tryToReplaceTypeByGenericType } from '../utils';
import { printType } from './type-printing';

/**
 * Checks if the given type exhibits any index signature (either number or string keys)
 */
function handleIndexPropertiesInType(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): TypeDetailCollection {
	const numberIndexType = type.getNumberIndexType();
	const stringIndexType = type.getStringIndexType();
	// if one of both signature type is found, follow value type recursively
	if (numberIndexType) {
		return generateTypeDetailCollection(
			numberIndexType,
			typeDetailCollection,
			level + 1,
			mapping,
		);
	}
	if (stringIndexType) {
		return generateTypeDetailCollection(
			stringIndexType,
			typeDetailCollection,
			level + 1,
			mapping,
		);
	}
	return typeDetailCollection;
}

/*
 * Iterates all properties of a type and follows the type of the properties recursively
 */
function handlePropertiesInType(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
) {
	for (const property of type.getProperties()) {
		generateTypeDetailCollection(
			getTypeFromSymbol(property),
			typeDetailCollection,
			level + 1,
			mapping,
		);
	}
}

/*
 * Mapper to convert a type to its corresponding type detail
 */
function typeToTypeDetail(type: Type, typeKind: TypeKind, mapping: GenericTypeMapping): TypeDetail {
	return {
		type: typeKind,
		typeName: printType(type, false, 0, mapping),
		detailString: printType(type, true, 0, mapping),
	};
}

/*+
 * Check whether the given type is a (literal) object type
 */
export function isObjectType(type: Type): boolean {
	const typeByAliasSymbol = type.getAliasSymbol()?.getDeclaredType();
	return (
		(type.isObject() || !!typeByAliasSymbol?.isObject()) &&
		type.getCallSignatures().length === 0 &&
		!type.getSymbol()?.getDeclaredType()?.isClassOrInterface()
	);
}

/**
 * Checks whether the given type is a function
 */
export function isFunctionType(type: Type): boolean {
	return type.getCallSignatures().length > 0;
}

export function isArray(type: Type): boolean {
	return !!type.getSymbol()?.getDeclaredType().isArray();
}

export function isReadonlyArray(type: Type): boolean {
	return (
		!type.isUnionOrIntersection() &&
		!!type.getSymbol()?.getDeclaredType().getText().startsWith('readonly')
	);
}

export function isInterface(type: Type): boolean {
	const declaredType = type.getSymbol()?.getDeclaredType();
	return !!declaredType?.isInterface() && !declaredType.isArray();
}

function isTypeFromNodeModules(symbol?: TsMorphSymbol): boolean {
	if (!symbol) {
		return false;
	}
	return symbol.getDeclarations().some((decl) => decl.getSourceFile().isInNodeModules());
}

function isTypeAlreadyCollected(collection: TypeDetailCollection, type: Type): boolean {
	return (
		(!!type.getSymbol() && collection.has(type.getSymbolOrThrow())) ||
		(!!type.getAliasSymbol() && collection.has(type.getAliasSymbolOrThrow()))
	);
}

/**
 * Given a symbol, get the corresponding type
 */
function getTypeFromSymbol(symbol: TsMorphSymbol): Type {
	return symbol.getValueDeclaration()?.getType() || symbol.getDeclaredType();
}

export function getTypeArgumentsFromType(type: Type): Type[] {
	if (type.getTypeArguments().length > 0) {
		return type.getTypeArguments();
	}
	if (type.getAliasTypeArguments().length > 0) {
		return type.getAliasTypeArguments();
	}
	return [];
}

export function addGenericTypeMappings(
	typeArgs: Type[],
	typeParams: Type[],
	mapping: GenericTypeMapping,
): void {
	if (typeArgs.length > 0 && typeParams.length === typeArgs.length) {
		for (let i = 0; i < typeParams.length; i++) {
			const argSymbol = typeArgs[i].getSymbol();
			const existingMappedArg = argSymbol ? mapping.get(argSymbol) : undefined;
			const mappedArg = existingMappedArg ?? typeArgs[i];
			mapping.set(typeParams[i].getSymbolOrThrow(), mappedArg);
		}
	}
}

function addGenericTypeMappingsForSymbol(type: Type, mapping: GenericTypeMapping): void {
	const typeArguments = type.getTypeArguments();
	const typeParams = type.getSymbol()?.getDeclaredType().getTypeArguments() || [];
	addGenericTypeMappings(typeArguments, typeParams, mapping);
}

function addGenericTypeMappingForAliasSymbol(type: Type, mapping: GenericTypeMapping): void {
	const typeArguments = type.getAliasTypeArguments();
	const typeParams = type.getAliasSymbol()?.getDeclaredType()?.getAliasTypeArguments() || [];
	addGenericTypeMappings(typeArguments, typeParams, mapping);
}

function handleInterface(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): void {
	// only handle interfaces if they are defined in the own project and not in any third-party-library
	const symbol = type.getSymbolOrThrow();
	if (!isArray(type) && !isReadonlyArray(type) && !isTypeFromNodeModules(symbol)) {
		addGenericTypeMappingsForSymbol(type, mapping);
		const typeToPrint = type.getSymbolOrThrow().getDeclaredType();
		const typeDetail = typeToTypeDetail(typeToPrint, 'interface', mapping);
		typeDetailCollection.set(type.getSymbolOrThrow(), typeDetail);
	}
	handlePropertiesInType(type, typeDetailCollection, level, mapping);
	handleIndexPropertiesInType(type, typeDetailCollection, level, mapping);
}

function handleLiteralObject(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): void {
	if (type.getAliasSymbol()) {
		addGenericTypeMappingForAliasSymbol(type, mapping);
		const typeToPrint = type.getAliasSymbolOrThrow().getDeclaredType();
		const typeDetail: TypeDetail = typeToTypeDetail(typeToPrint, 'type', mapping);
		typeDetailCollection.set(type.getAliasSymbolOrThrow(), typeDetail);
	}
	// same as for interfaces, but without registering anything to the typeDetailCollection
	// not quite sure if the condition is completely correct to select some
	// anonymous object declaredType like @Input() x: { fieldA: string, fieldB: string } ...
	handlePropertiesInType(type, typeDetailCollection, level, mapping);
	handleIndexPropertiesInType(type, typeDetailCollection, level, mapping);
}

function handleFunction(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): void {
	if (type.getAliasSymbol()) {
		const typeDetail: TypeDetail = typeToTypeDetail(type, 'function', mapping);
		typeDetailCollection.set(type.getAliasSymbolOrThrow(), typeDetail);
	}
	type.getCallSignatures().forEach((cs) => {
		generateTypeDetailCollection(cs.getReturnType(), typeDetailCollection, level, mapping);
		cs.getParameters().forEach((param) => {
			generateTypeDetailCollection(
				getTypeFromSymbol(param),
				typeDetailCollection,
				level,
				mapping,
			);
		});
	});
}

function handleUnionOrIntersection(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): void {
	// if the alias symbol is available, this union/intersection is a declaredType alias
	// therefore register it to the typeDetailCollection
	if (type.getAliasSymbol()) {
		const typeDetail: TypeDetail = typeToTypeDetail(type, 'type', mapping);
		typeDetailCollection.set(type.getAliasSymbolOrThrow(), typeDetail);
	}
	// In case of union / intersection declaredType follow all intersection/union parts
	const types = type.isUnion() ? type.getUnionTypes() : type.getIntersectionTypes();
	types.forEach((t) => generateTypeDetailCollection(t, typeDetailCollection, level + 1, mapping));
}

function handleAliasTypeArguments(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): void {
	for (const arg of type.getAliasTypeArguments()) {
		generateTypeDetailCollection(arg, typeDetailCollection, level, mapping);
	}
}

function handleTypeArguments(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): void {
	for (const arg of type.getTypeArguments()) {
		generateTypeDetailCollection(arg, typeDetailCollection, level, mapping);
	}
}

/*
 * Given a root type, recursively create a typeDetailCollection, which contains
 * all non-primitive named types from the respective type tree.
 */
export function generateTypeDetailCollection(
	type: Type,
	typeDetailCollection: TypeDetailCollection,
	level: number,
	mapping: GenericTypeMapping,
): TypeDetailCollection {
	const t = tryToReplaceTypeByGenericType(type, mapping);

	if (level > 1 || isTypeAlreadyCollected(typeDetailCollection, t)) {
		return typeDetailCollection;
	}

	if (t.getAliasSymbol()) {
		addGenericTypeMappingForAliasSymbol(t, mapping);
		handleAliasTypeArguments(t, typeDetailCollection, level, mapping);
	}

	if (t.getSymbol()) {
		addGenericTypeMappingsForSymbol(t, mapping);
		handleTypeArguments(t, typeDetailCollection, level, mapping);
	}

	// do not follow external types
	if (isTypeFromNodeModules(type.getSymbol()) || isTypeFromNodeModules(type.getAliasSymbol())) {
		return typeDetailCollection;
	}

	// do not follow arrays and readonly arrays even though they are declared as
	// interfaces
	if (isArray(type) || isReadonlyArray(type)) {
		return typeDetailCollection;
	}

	if (isInterface(t)) {
		handleInterface(t, typeDetailCollection, level, mapping);
	} else if (isObjectType(t)) {
		handleLiteralObject(t, typeDetailCollection, level, mapping);
	} else if (isFunctionType(t)) {
		handleFunction(t, typeDetailCollection, level, mapping);
	} else if (t.isUnion() || t.isIntersection()) {
		handleUnionOrIntersection(t, typeDetailCollection, level, mapping);
	}
	return typeDetailCollection;
}
