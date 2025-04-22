import { ClassDeclaration, Node, SyntaxKind, Type } from 'ts-morph';
import {
	EntitiesByCategory,
	Entity,
	GenericTypeMapping,
	TsMorphSymbol,
	ClassInformation,
} from '../../types';
import { EXCLUDE_DOCS_JS_DOCS_PARAM, groupBy } from '../utils';
import { isNativeAngularMethod } from './angular-utils';
import { collectBaseClasses, hasJsDocsTag } from './ast-utils';
import { mapDeclarationToEntities } from './declaration-mappers';
import { addGenericTypeMappings } from './type-details';
import { getterOrSetterInputExists, mergeEntities } from './utils';

/**
 * Creates mappings from generic class arguments of a subClass to the generic
 * type parameters of the parent class. References are stored in weakMaps using
 * ts-morph symbols (which are actually classes) to be able to resolve encountered
 * types in a class by reference.
 *
 * Example, given the following two classes:
 *  class ChildComponent extends ParentComponent<string, number>{}
 *  class ParentComponent<S, T> {}
 *
 * The resulting mapping would look something like this:
 * WeakMap {
 *     <Symbol of ParentComponent> => WeakMap {
 *          <Symbol of S> => string
 *          <Symbol of T> => number
 *     }
 *}
 *
 * This information can later be used to map properties in base-classes to the
 * actual type that is available when creating type-docs for a subClass.
 */
function extractGenericTypesFromClasses(classDeclarations: ClassDeclaration[]): GenericTypeMapping {
	const result = new WeakMap<TsMorphSymbol, Type>();
	for (const classDeclaration of classDeclarations) {
		const targetTypeArguments =
			classDeclaration
				.getExtends()
				?.getTypeArguments()
				.map((a) => a.getType()) || [];
		const baseClass = classDeclaration.getBaseClass();
		const sourceTypeArguments = baseClass?.getTypeParameters().map((p) => p.getType()) || [];
		addGenericTypeMappings(targetTypeArguments, sourceTypeArguments, result);
	}
	return result;
}

/**
 * Collects all class entities (properties, getters, setters, methods) of a classDeclaration
 */
function getClassEntities(
	classDeclaration: ClassDeclaration,
	propertiesToExclude: RegExp | undefined,
	genericTypeMapping: GenericTypeMapping,
): Map<string, Entity> {
	const properties = classDeclaration.getProperties();
	const setters = classDeclaration.getSetAccessors();
	const getters = classDeclaration.getGetAccessors();
	const methods = classDeclaration.getMethods();

	const entities = new Map<string, Entity>();

	for (const declaration of [...properties, ...setters, ...getters, ...methods]) {
		// do not include the entity if is private/protected
		if (
			declaration.hasModifier(SyntaxKind.PrivateKeyword) ||
			declaration.hasModifier(SyntaxKind.ProtectedKeyword) ||
			(Node.isMethodDeclaration(declaration) &&
				isNativeAngularMethod(classDeclaration, declaration.getName())) ||
			hasJsDocsTag(declaration, EXCLUDE_DOCS_JS_DOCS_PARAM)
		) {
			continue;
		}

		// do not include the property if it passes the exclusion test
		if (propertiesToExclude?.test(declaration.getName())) {
			continue;
		}
		const declaredEntities = mapDeclarationToEntities({ declaration, genericTypeMapping });

		for (const entity of declaredEntities) {
			// If there already is an input getter/setter declaration, do not overwrite
			// the existing mapping
			if (getterOrSetterInputExists(entities, entity.name)) {
				continue;
			}

			entities.set(entity.name, entity);
		}
	}

	return entities;
}

export function generateClassesTypeInformation(
	classDeclarations: ClassDeclaration[],
	filePath: string,
	propertiesToExclude: RegExp | undefined,
): ClassInformation[] {
	const classesInformation: ClassInformation[] = [];

	for (const classDeclaration of classDeclarations) {
		const name = classDeclaration.getName();
		if (!name) {
			continue;
		}
		classesInformation.push(
			generateClassTypeInformation(classDeclaration, name, filePath, propertiesToExclude),
		);
	}

	return classesInformation;
}

export function generateClassTypeInformation(
	classDeclaration: ClassDeclaration,
	name: string,
	filePath: string,
	propertiesToExclude: RegExp | undefined,
): ClassInformation {
	const baseClasses = collectBaseClasses(classDeclaration);
	const allClasses = [classDeclaration, ...baseClasses];
	const genericTypeMapping = extractGenericTypesFromClasses(allClasses);
	const classEntities = allClasses.map((classDeclaration: ClassDeclaration) =>
		getClassEntities(classDeclaration, propertiesToExclude, genericTypeMapping),
	);
	const mergedClassEntities = mergeEntities(classEntities);

	// do not generate type info for anonymous classes
	return {
		name,
		modulePath: filePath,
		entitiesByCategory: groupBy(
			mergedClassEntities,
			(entity) => entity.kind,
		) as EntitiesByCategory,
	};
}
