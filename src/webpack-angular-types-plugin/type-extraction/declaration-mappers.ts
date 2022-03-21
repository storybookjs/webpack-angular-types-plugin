import {
    GetAccessorDeclaration,
    MethodDeclaration,
    PropertyDeclaration,
    SetAccessorDeclaration,
} from "ts-morph";
import { Property, TypeDetail } from "../../types";
import {
    getJsDocs,
    isTypeRequired,
    retrieveInputOutputDecoratorAlias,
} from "./ast-utils";
import {
    generateTypeDetailCollection,
    stringifyTypeDetailCollection,
} from "./type-details";
import { typeToString } from "./type-printing";

/*
 * Maps a ts-morph property declaration to our internal Property type
 */
export function mapProperty(property: PropertyDeclaration): Property {
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

/*
 * Maps a ts-morph get accessor declaration to our internal Property type
 */
export function mapGetAccessor(getAccessor: GetAccessorDeclaration): Property {
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
export function mapMethod(method: MethodDeclaration): Property {
    return {} as Property;
}
