import { ClassDeclaration, Project, SyntaxKind } from "ts-morph";
import { ClassInformation, EntitiesByCategory, Entity } from "../../types";
import { groupBy } from "../utils";
import {
    collectBaseClasses,
    extractComponentOrDirectiveAnnotatedClasses,
} from "./ast-utils";
import { mapToEntity } from "./declaration-mappers";

function getterOrSetterInputExists(
    entities: Map<string, Entity>,
    name: string
): boolean {
    const entity = entities.get(name);
    return !!entity && entity.kind === "input";
}

/*
 * Collects all class members (properties, getters, setters, methods) of a classDeclaration
 * and sorts them into categories (inputs, outputs, normal properties, public methods etc...)
 */
function getClassEntities(
    classDeclaration: ClassDeclaration,
    propertiesToExclude: RegExp | undefined
): Map<string, Entity> {
    const properties = classDeclaration.getProperties();
    const setters = classDeclaration.getSetAccessors();
    const getters = classDeclaration.getGetAccessors();
    const methods = classDeclaration.getMethods();

    const entities = new Map<string, Entity>();

    for (const declaration of [
        ...properties,
        ...setters,
        ...getters,
        ...methods,
    ]) {
        // do not include the entity if is private/protected
        if (
            declaration.hasModifier(SyntaxKind.PrivateKeyword) ||
            declaration.hasModifier(SyntaxKind.ProtectedKeyword)
        ) {
            continue;
        }

        // do not include the property if it passes the exclusion test
        if (propertiesToExclude?.test(declaration.getName())) {
            continue;
        }

        const entity = mapToEntity(declaration);

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
 * Merges an array of class properties. Convention: Class properties are provided
 * in decreasing priority, i.e. fields from class properties at the end of the input
 * array are overridden by class properties on a lower index on the input array.
 */
export function mergeClassEntities(
    classEntities: Map<string, Entity>[]
): Map<string, Entity> {
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
 * all angular-related (component/directive) classes
 */
export function generateClassInformation(
    filepath: string,
    project: Project,
    propertiesToExclude: RegExp | undefined
): ClassInformation[] {
    const sourceFile = project.getSourceFile(filepath);
    if (!sourceFile) {
        return [];
    }
    const annotatedClassDeclarations =
        extractComponentOrDirectiveAnnotatedClasses(sourceFile);
    const result: ClassInformation[] = [];
    for (const classDeclaration of annotatedClassDeclarations) {
        const baseClasses = collectBaseClasses(classDeclaration);
        const classEntities = [classDeclaration, ...baseClasses].map((bc) =>
            getClassEntities(bc, propertiesToExclude)
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
                (entity) => entity.kind
            ) as EntitiesByCategory,
        });
    }
    return result;
}
