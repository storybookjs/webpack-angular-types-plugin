import {
    ClassDeclaration,
    GetAccessorDeclaration,
    MethodDeclaration,
    Project,
    PropertyDeclaration,
    SetAccessorDeclaration,
    SyntaxKind,
} from "ts-morph";
import { ClassInformation, ClassProperties, Property } from "../../types";
import { removeFromMapsIfExists } from "../utils";
import {
    collectBaseClasses,
    extractComponentOrDirectiveAnnotatedClasses,
} from "./ast-utils";
import {
    mapGetAccessor,
    mapMethod,
    mapProperty,
    mapSetAccessor,
} from "./declaration-mappers";

/*
 * Collects all class members (properties, getters, setters, methods) of a classDeclaration
 * and sorts them into categories (inputs, outputs, normal properties, public methods etc...)
 */
function getClassMembers(
    classDeclaration: ClassDeclaration,
    propertiesToExclude: RegExp | undefined
): ClassProperties {
    const properties = classDeclaration.getProperties();
    const setters = classDeclaration.getSetAccessors();
    const getters = classDeclaration.getGetAccessors();
    const methods = classDeclaration.getMethods();

    const inputs = [];
    const outputs = [];
    const propertiesWithoutDecorators = [];
    const publicMethods = [];

    for (const declaration of [
        ...properties,
        ...setters,
        ...getters,
        ...methods,
    ]) {
        // do not include the property if is private/protected
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

        let prop: Property;
        if (declaration instanceof PropertyDeclaration) {
            prop = mapProperty(declaration);
        } else if (declaration instanceof SetAccessorDeclaration) {
            prop = mapSetAccessor(declaration);
        } else if (declaration instanceof GetAccessorDeclaration) {
            prop = mapGetAccessor(declaration);
        } else {
            prop = mapMethod(declaration);
        }
        if (declaration.getDecorator("Input")) {
            inputs.push(prop);
        } else if (declaration.getDecorator("Output")) {
            outputs.push(prop);
        } else if (declaration instanceof MethodDeclaration) {
            publicMethods.push(prop);
        } else {
            propertiesWithoutDecorators.push(prop);
        }
    }

    return {
        inputs,
        outputs,
        properties: propertiesWithoutDecorators,
        methods: publicMethods,
    };
}

/*
 * Checks whether in the map a setter/getter property with the given name exists that has some description/defaultValue
 * defined. In this manner it can be checked, if the user applied jsdoc to either the getter/setter without overriding
 * the documentation with the undocumented getter/setter.
 */
function setterOrGetterPropertyWithDocsAlreadyExists(
    map: Map<string, Property>,
    propertyName: string
): boolean {
    const existingProperty = map.get(propertyName);
    if (!existingProperty) {
        return false;
    }
    const { modifier, defaultValue, description } = existingProperty;
    return (
        !!existingProperty && !!modifier && (!!defaultValue || !!description)
    );
}

/*
 * Merges an array of class properties. Convention: Class properties are provided
 * in decreasing priority, i.e. fields from class properties at the end of the input
 * array are overridden by class properties on a lower index on the input array.
 */
export function mergeClassProperties(
    classProperties: ClassProperties[]
): ClassProperties {
    if (classProperties.length === 1) {
        return classProperties[0];
    }
    const inputs = new Map<string, Property>();
    const outputs = new Map<string, Property>();
    const propertiesWithoutDecorators = new Map<string, Property>();
    const methods = new Map<string, Property>();

    for (let i = classProperties.length - 1; i > -1; i--) {
        const toMerge = classProperties[i];
        for (const inputToMerge of toMerge.inputs) {
            /*
             *  can happen if a newly defined input was defined as another property type
             * e.g. base class defines @Output property, child class overrides it as in @Input() property
             *      this should never happen in valid/useful angular code
             */
            removeFromMapsIfExists(
                [outputs, propertiesWithoutDecorators, methods],
                inputToMerge.name
            );
            if (
                setterOrGetterPropertyWithDocsAlreadyExists(
                    inputs,
                    inputToMerge.name
                )
            ) {
                continue;
            }
            inputs.set(inputToMerge.name, inputToMerge);
        }
        for (const outputToMerge of toMerge.outputs) {
            removeFromMapsIfExists(
                [inputs, propertiesWithoutDecorators, methods],
                outputToMerge.name
            );
            // no getter/setter check performed here, like for input/properties, since outputs
            // usually are not implemented as getter/setter in the angular world
            outputs.set(outputToMerge.name, outputToMerge);
        }
        for (const propertyWithoutDecorator of toMerge.properties) {
            removeFromMapsIfExists(
                [inputs, outputs, methods],
                propertyWithoutDecorator.name
            );
            if (
                setterOrGetterPropertyWithDocsAlreadyExists(
                    propertiesWithoutDecorators,
                    propertyWithoutDecorator.name
                )
            ) {
                continue;
            }
            propertiesWithoutDecorators.set(
                propertyWithoutDecorator.name,
                propertyWithoutDecorator
            );
        }

        for (const method of toMerge.methods) {
            removeFromMapsIfExists(
                [inputs, outputs, propertiesWithoutDecorators],
                method.name
            );
            methods.set(method.name, method);
        }
    }
    return {
        inputs: Array.from(inputs.values()),
        outputs: Array.from(outputs.values()),
        properties: Array.from(propertiesWithoutDecorators.values()),
        methods: Array.from(methods.values()),
    };
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
        const classProperties = [classDeclaration, ...baseClasses].map((bc) =>
            getClassMembers(bc, propertiesToExclude)
        );
        const mergedClassProperties = mergeClassProperties(classProperties);
        const name = classDeclaration.getName();

        // do not generate type info for anonymous classes
        if (!name) {
            continue;
        }
        result.push({
            name,
            modulePath: filepath,
            properties: mergedClassProperties,
        });
    }
    return result;
}
