import { Symbol as TsMorphSymbol, Type } from "ts-morph";
import { TypeDetail, TypeDetailCollection, TypeKind } from "../../types";
import { printType } from "./type-printing";

/*
 * Checks if the given type exhibits any index signature (either number or string keys)
 */
function tryGenerateTypeDetailCollectionForIndexType(
    type: Type,
    typeDetailCollection: TypeDetailCollection,
    level: number
): Map<string, TypeDetail> {
    const numberIndexType = type.getNumberIndexType();
    const stringIndexType = type.getStringIndexType();
    // if one of both signature type is found, follow value type recursively
    if (numberIndexType) {
        return generateTypeDetailCollection(
            numberIndexType,
            typeDetailCollection,
            level + 1
        );
    }
    if (stringIndexType) {
        return generateTypeDetailCollection(
            stringIndexType,
            typeDetailCollection,
            level + 1
        );
    }
    return typeDetailCollection;
}

/*
 * Iterates all properties of a type and follows the type of the properties recursively
 */
function followPropertiesInType(
    type: Type,
    typeDetailCollection: TypeDetailCollection,
    level: number
) {
    for (const property of type.getProperties()) {
        generateTypeDetailCollection(
            getTypeFromSymbol(property),
            typeDetailCollection,
            level + 1
        );
    }
}

/*
 * Helper to convert a type to its corresponding type detail
 */
function typeToTypeDetail(type: Type, typeKind: TypeKind): TypeDetail {
    return {
        type: typeKind,
        typeName: printType(type, false),
        detailString: printType(type, true),
    };
}

export function isLiteralObjectType(type: Type): boolean {
    return (
        type.isObject() &&
        type.isAnonymous() &&
        type.getCallSignatures().length === 0 &&
        !type.isClassOrInterface()
    );
}

export function isFunctionType(type: Type): boolean {
    return type.getCallSignatures().length > 0;
}

function getTypeFromSymbol(symbol: TsMorphSymbol): Type {
    return symbol.getValueDeclaration()?.getType() || symbol.getDeclaredType();
}

/*
 * Given a root type, recursively create a typeDetailCollection, which contains
 * all non-primitive named types from the respective type tree.
 */
export function generateTypeDetailCollection(
    type: Type,
    typeDetailCollection: TypeDetailCollection,
    level = 0
): TypeDetailCollection {
    if (level > 1) {
        return typeDetailCollection;
    }
    // Type is already collected for this typeDetail
    if (typeDetailCollection.has(type.getText())) {
        return typeDetailCollection;
    }
    if (type.isInterface()) {
        // handle properties of interfaces
        const typeDetail = typeToTypeDetail(type, "interface");
        typeDetailCollection.set(type.getText(), typeDetail);
        followPropertiesInType(type, typeDetailCollection, level);
    } else if (isLiteralObjectType(type)) {
        // same as for interfaces, but without registering anything to the typeDetailCollection
        // not quite sure if the condition is completely correct to select some
        // anonymous object type like @Input() x: { fieldA: string, fieldB: string } ...
        followPropertiesInType(type, typeDetailCollection, level);
        tryGenerateTypeDetailCollectionForIndexType(
            type,
            typeDetailCollection,
            level
        );
    } else if (isFunctionType(type)) {
        if (type.getAliasSymbol()) {
            const typeDetail: TypeDetail = typeToTypeDetail(type, "function");
            typeDetailCollection.set(printType(type, false), typeDetail);
        }
        type.getCallSignatures().forEach((cs) => {
            generateTypeDetailCollection(
                cs.getReturnType(),
                typeDetailCollection
            );
            cs.getParameters().forEach((param) => {
                generateTypeDetailCollection(
                    getTypeFromSymbol(param),
                    typeDetailCollection
                );
            });
        });
    } else if (type.isUnion() || type.isIntersection()) {
        // if the alias symbol is available, this union/intersection is a type alias
        // therefore register it to the typeDetailCollection
        if (type.getAliasSymbol()) {
            const typeDetail: TypeDetail = typeToTypeDetail(type, "type");
            typeDetailCollection.set(type.getText(), typeDetail);
        }
        // In case of union / intersection type follow all intersection/union parts
        const types = type.isUnion()
            ? type.getUnionTypes()
            : type.getIntersectionTypes();
        types.forEach((t) =>
            generateTypeDetailCollection(t, typeDetailCollection, level + 1)
        );
    }
    // TODO add more handling of special types as they occur
    return typeDetailCollection;
}

/*
 * Stringifies a given typeDetailCollection, so that it can be
 */
export function stringifyTypeDetailCollection(
    typeDetailCollection: TypeDetailCollection
): string | undefined {
    if (typeDetailCollection.size === 0) {
        return undefined;
    }
    let result = "";
    for (const {
        type,
        typeName,
        detailString,
    } of typeDetailCollection.values()) {
        // type-aliases need some special output formatting since it is "type <type-alias-name> = <type>"
        // in all other cases, we simply print <type> <type-name> <type-declaration>
        if (type === "type") {
            result += `type ${typeName} = ${detailString};\n\n`;
        } else {
            result += `${type} ${typeName} ${detailString}\n\n`;
        }
    }
    return result;
}
