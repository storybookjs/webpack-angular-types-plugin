import {
    ClassDeclaration,
    DecoratableNode,
    JSDocableNode,
    Project,
    PropertyDeclaration,
    SetAccessorDeclaration,
    SourceFile,
    Type,
} from "ts-morph";
import { ClassInformation, ClassProperties, Property } from "../types";

function extractComponentOrDirectiveAnnotatedClasses(
    sourceFile: SourceFile
): ClassDeclaration[] {
    return sourceFile
        .getClasses()
        .filter(
            (classDeclaration: ClassDeclaration) =>
                !!(
                    classDeclaration.getDecorator("Component") ||
                    classDeclaration.getDecorator("Directive")
                )
        )
        .filter(
            (classDeclaration: ClassDeclaration) =>
                !classDeclaration.isAbstract()
        )
        .reduce(
            (acc: ClassDeclaration[], val: ClassDeclaration) => acc.concat(val),
            []
        );
}

function retrieveInputOutputDecoratorAlias(
    node: DecoratableNode
): string | undefined {
    for (const decoratorToCheck of ["Input", "Output"]) {
        if (node.getDecorator(decoratorToCheck)) {
            const decoratorArgs = node
                .getDecorator(decoratorToCheck)
                ?.getArguments();
            if (decoratorArgs && decoratorArgs.length === 1) {
                return decoratorArgs[0].getText();
            }
        }
    }
    return undefined;
}

function getJsDocs(node: JSDocableNode): string {
    return (
        node
            .getJsDocs()
            .map((doc) => doc.getCommentText())
            .join("\n") || ""
    );
}

function typeToString(type: Type): string {
    // TODO this needs to be refined. for example for event emitter import("...").EventEmitter<T>
    //      is printed by getText. I guess we need to follow the type here to resolve it to something useful
    const typeStr = type.getApparentType().getText();
    const lastIndexOfDot = typeStr.lastIndexOf(".");
    if (lastIndexOfDot > -1) {
        return typeStr.slice(lastIndexOfDot + 1);
    }
    return typeStr;
}

function isTypeRequired(type: Type): boolean {
    if (type.isUndefined()) {
        return false;
    } else if (type.isUnion()) {
        // check if the union type contains "undefined"
        for (type of type.getUnionTypes()) {
            if (type.isUndefined()) {
                return false;
            }
        }
    }
    return true;
}

function mapProperty(property: PropertyDeclaration): Property {
    return {
        alias: retrieveInputOutputDecoratorAlias(property),
        name: property.getName(),
        defaultValue: property.getInitializer()?.getText() || "",
        description: getJsDocs(property),
        type: typeToString(property.getType()),
        required: isTypeRequired(property.getType()),
    };
}

function mapSetAccessor(setAccessor: SetAccessorDeclaration): Property {
    const parameters = setAccessor.getParameters();
    const parameter = parameters.length === 1 ? parameters[0] : undefined;
    if (!parameter) {
        throw new Error("Invalid number of arguments for set accessor.");
    }
    return {
        alias: retrieveInputOutputDecoratorAlias(setAccessor),
        name: setAccessor.getName(),
        // Set accessors can not have a default value
        defaultValue: "",
        description: getJsDocs(setAccessor),
        type: typeToString(parameter.getType()),
        required: isTypeRequired(parameter.getType()),
    };
}

function getClassProperties(
    classDeclaration: ClassDeclaration
): ClassProperties {
    const properties = classDeclaration.getProperties();
    const setters = classDeclaration.getSetAccessors();

    const inputs = [];
    const outputs = [];
    const propertiesWithoutDecorators = [];

    for (const declaration of [...properties, ...setters]) {
        let prop: Property;
        if (declaration instanceof PropertyDeclaration) {
            prop = mapProperty(declaration);
        } else {
            prop = mapSetAccessor(declaration);
        }
        if (declaration.getDecorator("Input")) {
            inputs.push(prop);
        } else if (declaration.getDecorator("Output")) {
            outputs.push(prop);
        } else {
            propertiesWithoutDecorators.push(prop);
        }
    }

    return { inputs, outputs, propertiesWithoutDecorators };
}

export function removeFromMapIfExists<TKey, TVal>(
    map: Map<TKey, TVal>,
    key: TKey
): void {
    if (map.has(key)) {
        map.delete(key);
    }
}

export function mergeProperties(
    properties: ClassProperties[]
): ClassProperties {
    if (properties.length === 1) {
        return properties[0];
    }
    const inputs = new Map<string, Property>();
    const outputs = new Map<string, Property>();
    const propertiesWithoutDecorators = new Map<string, Property>();
    for (let i = properties.length - 1; i > -1; i--) {
        const toMerge = properties[i];
        for (const inputToMerge of toMerge.inputs) {
            // can happen if a newly defined input was defined as another property type
            // e.g. base class defines @Output property, child class overrides it as in @Input() property
            //      this should never happen in valid/useful angular code
            removeFromMapIfExists(outputs, inputToMerge.name);
            removeFromMapIfExists(
                propertiesWithoutDecorators,
                inputToMerge.name
            );
            inputs.set(inputToMerge.name, inputToMerge);
        }
        for (const outputToMerge of toMerge.outputs) {
            removeFromMapIfExists(inputs, outputToMerge.name);
            removeFromMapIfExists(
                propertiesWithoutDecorators,
                outputToMerge.name
            );
            outputs.set(outputToMerge.name, outputToMerge);
        }
        for (const propertyWithoutDecoratorsToMerge of toMerge.propertiesWithoutDecorators) {
            removeFromMapIfExists(
                inputs,
                propertyWithoutDecoratorsToMerge.name
            );
            removeFromMapIfExists(
                outputs,
                propertyWithoutDecoratorsToMerge.name
            );
            propertiesWithoutDecorators.set(
                propertyWithoutDecoratorsToMerge.name,
                propertyWithoutDecoratorsToMerge
            );
        }
    }
    return {
        inputs: Array.from(inputs.values()),
        outputs: Array.from(outputs.values()),
        propertiesWithoutDecorators: Array.from(
            propertiesWithoutDecorators.values()
        ),
    };
}

export function collectBaseClasses(cls: ClassDeclaration): ClassDeclaration[] {
    const bases: ClassDeclaration[] = [];
    let currentClass = cls.getBaseClass();
    while (currentClass) {
        bases.push(currentClass);
        currentClass = currentClass.getBaseClass();
    }
    return bases;
}

export function generateClassInformation(
    filepath: string,
    project: Project
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
        const properties = [classDeclaration, ...baseClasses].map((bc) =>
            getClassProperties(bc)
        );
        const mergedProperties = mergeProperties(properties);
        const name = classDeclaration.getName();

        // do not generate type info for anonymous classes
        if (!name) {
            continue;
        }
        result.push({
            name,
            modulePath: filepath,
            properties: mergedProperties,
        });
    }
    return result;
}
