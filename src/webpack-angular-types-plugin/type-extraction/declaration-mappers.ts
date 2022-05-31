import {
    GetAccessorDeclaration,
    MethodDeclaration,
    PropertyDeclaration,
    SetAccessorDeclaration,
} from "ts-morph";
import { Entity, EntityKind, TypeDetail } from "../../types";
import {
    getDefaultValue,
    getJsDocsDescription,
    getJsDocsParams,
    getJsDocsReturnDescription,
    isTypeRequired,
    retrieveInputOutputDecoratorAlias,
} from "./ast-utils";
import {
    generateTypeDetailCollection,
    stringifyTypeDetailCollection,
} from "./type-details";
import { printType } from "./type-printing";

function getEntityKind(
    declaration:
        | PropertyDeclaration
        | SetAccessorDeclaration
        | GetAccessorDeclaration
        | MethodDeclaration
): EntityKind {
    if (declaration.getDecorator("Input")) {
        return "input";
    } else if (declaration.getDecorator("Output")) {
        return "output";
    } else if (declaration instanceof MethodDeclaration) {
        return "method";
    } else {
        return "property";
    }
}

export function mapToEntity(
    declaration:
        | PropertyDeclaration
        | SetAccessorDeclaration
        | GetAccessorDeclaration
        | MethodDeclaration
): Entity {
    if (declaration instanceof PropertyDeclaration) {
        return mapProperty(declaration);
    } else if (declaration instanceof SetAccessorDeclaration) {
        return mapSetAccessor(declaration);
    } else if (declaration instanceof GetAccessorDeclaration) {
        return mapGetAccessor(declaration);
    } else {
        return mapMethod(declaration);
    }
}

/*
 * Maps a ts-morph property declaration to our internal Property type
 */
export function mapProperty(property: PropertyDeclaration): Entity {
    return {
        kind: getEntityKind(property),
        alias: retrieveInputOutputDecoratorAlias(property),
        name: property.getName(),
        defaultValue: getDefaultValue(property),
        description: getJsDocsDescription(property) || "",
        type: printType(property.getType(), false),
        typeDetails: stringifyTypeDetailCollection(
            generateTypeDetailCollection(
                property.getType(),
                new Map<string, TypeDetail>()
            )
        ),
        required: isTypeRequired(property.getType()),
    };
}

/*
 * Maps a ts-morph set accessor declaration to our internal Property type
 */
export function mapSetAccessor(setAccessor: SetAccessorDeclaration): Entity {
    const parameters = setAccessor.getParameters();
    const parameter = parameters.length === 1 ? parameters[0] : undefined;
    if (!parameter) {
        throw new Error("Invalid number of arguments for set accessor.");
    }
    return {
        kind: getEntityKind(setAccessor),
        alias: retrieveInputOutputDecoratorAlias(setAccessor),
        name: setAccessor.getName(),
        // accessors can not have a default value
        defaultValue: getDefaultValue(setAccessor),
        description: getJsDocsDescription(setAccessor) || "",
        type: printType(parameter.getType(), false),
        typeDetails: stringifyTypeDetailCollection(
            generateTypeDetailCollection(
                parameter.getType(),
                new Map<string, TypeDetail>()
            )
        ),
        required: isTypeRequired(parameter.getType()),
        modifier: "setter",
    };
}

/*
 * Maps a ts-morph get accessor declaration to our internal Property type
 */
export function mapGetAccessor(getAccessor: GetAccessorDeclaration): Entity {
    return {
        kind: getEntityKind(getAccessor),
        alias: retrieveInputOutputDecoratorAlias(getAccessor),
        name: getAccessor.getName(),
        // accessors can not have a default value
        defaultValue: undefined,
        description: getJsDocsDescription(getAccessor) || "",
        type: printType(getAccessor.getType(), false),
        typeDetails: stringifyTypeDetailCollection(
            generateTypeDetailCollection(
                getAccessor.getType(),
                new Map<string, TypeDetail>()
            )
        ),
        required: false,
        modifier: "getter",
    };
}

export function mapMethod(method: MethodDeclaration): Entity {
    return {
        kind: getEntityKind(method),
        alias: undefined,
        name: method.getName(),
        defaultValue: undefined,
        description: getJsDocsDescription(method),
        jsDocParams: getJsDocsParams(method),
        jsDocReturn: getJsDocsReturnDescription(method),
        type: method.getName() + printType(method.getType(), false),
        typeDetails: undefined,
    } as Entity;
}
