import {
    ClassDeclaration,
    DecoratableNode,
    GetAccessorDeclaration,
    JSDocableNode,
    MethodDeclaration,
    Project,
    PropertyDeclaration,
    SetAccessorDeclaration,
    SourceFile,
    Type,
} from "ts-morph";
import {
    ClassInformation,
    ClassProperties,
    Property,
    TypeDetail,
} from "../types";
import {
    generateUUID,
    stripQuotes,
    wrapInBraces,
    wrapInCurlyBraces,
} from "../utils";

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
                return stripQuotes(decoratorArgs[0].getText());
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

function truncateImportPart(typeStr: string): string {
    const regex = /import\(.+\)\./g;
    return typeStr.replace(regex, "");
}

function expandTypeToString(type: Type, level = 0): string {
    if (type.isUnion() || type.isIntersection()) {
        const types = type.isUnion()
            ? type.getUnionTypes()
            : type.getIntersectionTypes();
        const joinSymbol = type.isUnion() ? " | " : " & ";
        const res = types
            .map((t) => expandTypeToString(t, level + 1))
            .join(joinSymbol);
        return level > 0 ? wrapInBraces(res) : res;
        // interfaces are only expanded on the root level, and if interfaces should be expanded
    } else if (type.isInterface() && level === 0) {
        const res: string[] = [];
        for (const property of type.getProperties()) {
            const propName = property.getName();
            const propType = property.getValueDeclarationOrThrow().getType();
            res.push(`  ${propName}: ${expandTypeToString(propType, level)};`);
        }
        return wrapInCurlyBraces(res.join("\n"));
    } else if (type.getStringIndexType() || type.getNumberIndexType()) {
        return truncateImportPart(type.getText());
    } else {
        return truncateImportPart(type.getText());
    }
}

function typeToString(type: Type): string {
    return truncateImportPart(type.getText());
}

function tryGenerateTypeDetailCollectionForIndexType(
    type: Type,
    typeDetailCollection: Map<string, TypeDetail>
): Map<string, TypeDetail> {
    const numberIndexType = type.getNumberIndexType();
    const stringIndexType = type.getStringIndexType();
    if (numberIndexType) {
        return generateTypeDetailCollection(
            numberIndexType,
            typeDetailCollection
        );
    }
    if (stringIndexType) {
        return generateTypeDetailCollection(
            stringIndexType,
            typeDetailCollection
        );
    }
    return typeDetailCollection;
}

function generateTypeDetailCollection(
    type: Type,
    typeDetailCollection: Map<string, TypeDetail>
): Map<string, TypeDetail> {
    // Type is already collected for this typeDetail
    if (typeDetailCollection.has(type.getText())) {
        return typeDetailCollection;
    }

    if (type.isInterface()) {
        const typeDetail: TypeDetail = {
            type: "interface",
            detailString: expandTypeToString(type, 0),
        };
        typeDetailCollection.set(typeToString(type), typeDetail);
    }

    if (type.isInterface() || (type.isObject() && type.isAnonymous())) {
        for (const property of type.getProperties()) {
            generateTypeDetailCollection(
                property.getValueDeclarationOrThrow().getType(),
                typeDetailCollection
            );
        }
        tryGenerateTypeDetailCollectionForIndexType(type, typeDetailCollection);
    }

    if (type.isUnion() || type.isIntersection()) {
        if (type.getAliasSymbol()) {
            const typeDetail: TypeDetail = {
                type: "type",
                detailString: expandTypeToString(type),
            };
            typeDetailCollection.set(typeToString(type), typeDetail);
        }
        const types = type.isUnion()
            ? type.getUnionTypes()
            : type.getIntersectionTypes();
        types.forEach((t) =>
            generateTypeDetailCollection(t, typeDetailCollection)
        );
    }

    return typeDetailCollection;
}

function stringifyTypeDetailCollection(
    typeDetailCollection: Map<string, TypeDetail>
): string | undefined {
    if (typeDetailCollection.size === 0) {
        return undefined;
    }
    let result = "";
    for (const [key, value] of typeDetailCollection.entries()) {
        if (value.type === "type") {
            result += `type ${key} = ${value.detailString};\n\n`;
        } else {
            result += `${value.type} ${key} ${value.detailString}\n\n`;
        }
    }
    return result;
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
        defaultValue: property.getInitializer()?.getText(),
        description: getJsDocs(property),
        type: typeToString(property.getType()),
        typeDetails: stringifyTypeDetailCollection(
            generateTypeDetailCollection(
                property.getType(),
                new Map<string, TypeDetail>()
            )
        ),
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
        // accessors can not have a default value
        defaultValue: undefined,
        description: getJsDocs(setAccessor),
        type: typeToString(parameter.getType()),
        typeDetails: stringifyTypeDetailCollection(
            generateTypeDetailCollection(
                parameter.getType(),
                new Map<string, TypeDetail>()
            )
        ),
        required: isTypeRequired(parameter.getType()),
    };
}

function mapGetAccessor(getAccessor: GetAccessorDeclaration): Property {
    return {
        alias: retrieveInputOutputDecoratorAlias(getAccessor),
        name: getAccessor.getName(),
        // accessors can not have a default value
        defaultValue: undefined,
        description: getJsDocs(getAccessor),
        type: typeToString(getAccessor.getType()),
        typeDetails: stringifyTypeDetailCollection(
            generateTypeDetailCollection(
                getAccessor.getType(),
                new Map<string, TypeDetail>()
            )
        ),
        required: false,
    };
}

// TODO implement method mapping
function mapMethod(method: MethodDeclaration): Property {
    return {} as Property;
}

function getClassMembers(classDeclaration: ClassDeclaration): ClassProperties {
    const properties = classDeclaration.getProperties();
    const setters = classDeclaration.getSetAccessors();
    const getters = classDeclaration.getGetAccessors();
    const methods = classDeclaration
        .getMethods()
        .filter((method) => !method.getText().startsWith("_"));

    const inputs = [];
    const outputs = [];
    const propertiesWithoutDecorators = [];
    const componentMethods = [];

    for (const declaration of [
        ...properties,
        ...setters,
        ...getters,
        ...methods,
    ]) {
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
            componentMethods.push(prop);
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
            getClassMembers(bc)
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
            uuid: generateUUID(),
        });
    }
    return result;
}
