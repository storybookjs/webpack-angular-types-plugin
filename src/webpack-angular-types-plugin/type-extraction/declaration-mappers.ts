import {
    GetAccessorDeclaration,
    MethodDeclaration,
    PropertyDeclaration,
    SetAccessorDeclaration,
} from "ts-morph";
import { Property, TypeDetail } from "../../types";
import {
    getDefaultValue,
    getFunctionJsDocsDescription,
    getJsDocsDescription,
    isTypeRequired,
    retrieveInputOutputDecoratorAlias,
} from "./ast-utils";
import {
    generateTypeDetailCollection,
    stringifyTypeDetailCollection,
} from "./type-details";
import { printType } from "./type-printing";

/*
 * Maps a ts-morph property declaration to our internal Property type
 */
export function mapProperty(property: PropertyDeclaration): Property {
    return {
        alias: retrieveInputOutputDecoratorAlias(property),
        name: property.getName(),
        defaultValue: getDefaultValue(property),
        description: getJsDocsDescription(property),
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
export function mapSetAccessor(setAccessor: SetAccessorDeclaration): Property {
    const parameters = setAccessor.getParameters();
    const parameter = parameters.length === 1 ? parameters[0] : undefined;
    if (!parameter) {
        throw new Error("Invalid number of arguments for set accessor.");
    }
    return {
        alias: retrieveInputOutputDecoratorAlias(setAccessor),
        name: setAccessor.getName(),
        // accessors can not have a default value
        defaultValue: getDefaultValue(setAccessor),
        description: getJsDocsDescription(setAccessor),
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
export function mapGetAccessor(getAccessor: GetAccessorDeclaration): Property {
    return {
        alias: retrieveInputOutputDecoratorAlias(getAccessor),
        name: getAccessor.getName(),
        // accessors can not have a default value
        defaultValue: undefined,
        description: getJsDocsDescription(getAccessor),
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

export function mapMethod(method: MethodDeclaration): Property {
    return {
        alias: undefined,
        name: method.getName(),
        defaultValue: undefined,
        description: getFunctionJsDocsDescription(method),
        type: method.getName() + printType(method.getType(), false),
        typeDetails: undefined,
    } as Property;
}
