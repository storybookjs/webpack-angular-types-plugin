import { ClassDeclaration, GetAccessorDeclaration, MethodDeclaration, Project, PropertyDeclaration, SetAccessorDeclaration, SyntaxKind, Type } from 'ts-morph';
import { ClassInformation, EntitiesByCategory, Entity, GenericTypeMapping, TsMorphSymbol } from '../../types';
import { groupBy } from '../utils';
import { collectBaseClasses, extractComponentOrDirectiveAnnotatedClasses } from './ast-utils';
import { mapToEntity } from './declaration-mappers';
import { addGenericTypeMappings } from './type-details';
import { Node } from 'ts-morph';

/**
 * Checks whether a getter/setter input is already present in the given map
 */
function getterOrSetterInputExists(entities: Map<string, Entity>, name: string): boolean {
	const entity = entities.get(name);
	return !!entity && entity.kind === 'input';
}

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
function extractGenericTypesFromClass(classDeclarations: ClassDeclaration[]): GenericTypeMapping {
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

const BUILT_IN_ANGULAR_METHODS: { methodName: string, interfaceName: string }[] = [
	{ methodName: 'ngOnInit', interfaceName: 'OnInit' },
	{ methodName: 'ngOnChanges', interfaceName: 'OnChanges'},
	{ methodName: 'ngAfterContentInit', interfaceName: 'AfterContentInit' },
	{ methodName: 'ngAfterViewInit', interfaceName: 'AfterViewInit' },
	{ methodName: 'ngOnDestroy', interfaceName: 'OnDestroy' },
	{ methodName: 'ngDoCheck', interfaceName: 'DoCheck'},
	{ methodName: 'ngAfterContentChecked', interfaceName: 'AfterContentChecked'},
	{ methodName: 'ngAfterViewChecked', interfaceName: 'AfterViewChecked'},
	{ methodName: 'writeValue', interfaceName: 'ControlValueAccessor'},
	{ methodName: 'registerOnChange', interfaceName: 'ControlValueAccessor'},
	{ methodName: 'registerOnTouched', interfaceName: 'ControlValueAccessor'},
	{ methodName: 'setDisabledState', interfaceName: 'ControlValueAccessor' },
	{ methodName: 'validate', interfaceName: 'Validator'},
	{ methodName: 'registerOnValidatorChange', interfaceName: 'Validator'},
]

function isBuiltinAngularMethod(classDecl: ClassDeclaration, methodName: string): boolean {
	const candidate = BUILT_IN_ANGULAR_METHODS.find(builtInMethod => builtInMethod.methodName === methodName);
	if (!candidate) {
		return false;
	}
	const isImplemented = classDecl.getImplements().find(implement => implement.getText() === candidate.interfaceName);
	return !!isImplemented;
}

function isExcludedViaJsDocs(declaration: PropertyDeclaration | SetAccessorDeclaration | GetAccessorDeclaration | MethodDeclaration): boolean {
	return declaration.getJsDocs().some(jsDoc => jsDoc.getInnerText().includes('@exclude-docs'))
}

/*
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
				isBuiltinAngularMethod(classDeclaration, declaration.getName())) ||
			isExcludedViaJsDocs(declaration)
		) {
			continue;
		}

		// do not include the property if it passes the exclusion test
		if (propertiesToExclude?.test(declaration.getName())) {
			continue;
		}
		const entity = mapToEntity({ declaration, genericTypeMapping });

		// If there already is an input getter/setter declaration, do not overwrite
		// the existing mapping
		if (getterOrSetterInputExists(entities, entity.name)) {
			continue;
		}

		entities.set(entity.name, entity);
	}

	return entities;
}

/*
 * Merges an array of class entities. Convention: Class entities are provided
 * in decreasing priority, i.e. fields from class entities at the end of the input
 * array are overridden by class entities on a lower index on the input array.
 */
export function mergeClassEntities(classEntities: Map<string, Entity>[]): Map<string, Entity> {
	if (classEntities.length === 1) {
		return classEntities[0];
	}
	const result = new Map<string, Entity>();

	for (let i = classEntities.length - 1; i > -1; i--) {
		const entitiesToMerge = classEntities[i];
		for (const entityToMerge of entitiesToMerge.values()) {
			if (getterOrSetterInputExists(result, entityToMerge.name)) {
				continue;
			}

			result.set(entityToMerge.name, entityToMerge);
		}
	}
	return result;
}

/*
 * Given a sourceFile and a typescript-project, collect class information for
 * all angular-related (component/directive) classes in this source-file
 */
export function generateClassInformation(
	filepath: string,
	project: Project,
	propertiesToExclude: RegExp | undefined,
): ClassInformation[] {
	const sourceFile = project.getSourceFile(filepath);
	if (!sourceFile) {
		return [];
	}
	const annotatedClassDeclarations = extractComponentOrDirectiveAnnotatedClasses(sourceFile);
	const result: ClassInformation[] = [];
	for (const classDeclaration of annotatedClassDeclarations) {
		const baseClasses = collectBaseClasses(classDeclaration);
		const allClasses = [classDeclaration, ...baseClasses];
		const genericTypeMapping = extractGenericTypesFromClass(allClasses);
		const classEntities = allClasses.map((classDeclaration: ClassDeclaration) =>
			getClassEntities(classDeclaration, propertiesToExclude, genericTypeMapping),
		);
		const mergedClassEntities = mergeClassEntities(classEntities);
		const name = classDeclaration.getName();

		// do not generate type info for anonymous classes
		if (!name) {
			continue;
		}
		result.push({
			name,
			modulePath: filepath,
			entitiesByCategory: groupBy(
				mergedClassEntities,
				(entity) => entity.kind,
			) as EntitiesByCategory,
		});
	}
	return result;
}
