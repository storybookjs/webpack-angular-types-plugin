import { Type } from "ts-morph";
import { TypeDetail, TypeDetailCollection, TypeKind } from "../../types";
import { typeToExpandedString, typeToString } from "./type-printing";

/*
 * Checks if the given type exhibits any index signature (either number or string keys)
 */
function tryGenerateTypeDetailCollectionForIndexType(
    type: Type,
    typeDetailCollection: TypeDetailCollection
): Map<string, TypeDetail> {
    const numberIndexType = type.getNumberIndexType();
    const stringIndexType = type.getStringIndexType();
    // if one of both signature type is found, follow value type recursively
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

/*
 * Iterates all properties of a type and follows the type of the properties recursively
 */
function followPropertiesInType(
    type: Type,
    typeDetailCollection: TypeDetailCollection
) {
    for (const property of type.getProperties()) {
        generateTypeDetailCollection(
            property.getValueDeclarationOrThrow().getType(),
            typeDetailCollection
        );
    }
}

/*
 * Helper to convert a type to its corresponding type detail
 */
function typeToTypeDetail(type: Type, typeKind: TypeKind): TypeDetail {
    return {
        type: typeKind,
        detailString: typeToExpandedString(type, 0),
    };
}

/*
 * Given a root type, recursively create a typeDetailCollection, which contains
 * all non-primitive named types from the respective type tree.
 */
export function generateTypeDetailCollection(
    type: Type,
    typeDetailCollection: TypeDetailCollection
): Map<string, TypeDetail> {
    // Type is already collected for this typeDetail
    if (typeDetailCollection.has(type.getText())) {
        return typeDetailCollection;
    }

    // interfaces are registered to the typeDetailCollection, all properties are handled recursively
    if (type.isInterface()) {
        const typeDetail = typeToTypeDetail(type, "interface");
        typeDetailCollection.set(typeToString(type), typeDetail);
        followPropertiesInType(type, typeDetailCollection);
    }

    // same as for interfaces, but without registering anything to the typeDetailCollection
    // not quite sure if the condition is completely correct to select some
    // anonymous object type like @Input() x: { fieldA: string, fieldB: string } ...
    if (type.isObject() && type.isAnonymous()) {
        followPropertiesInType(type, typeDetailCollection);
        tryGenerateTypeDetailCollectionForIndexType(type, typeDetailCollection);
    }

    if (type.isUnion() || type.isIntersection()) {
        // if the alias symbol is available, this union/intersection is a type alias
        // therefore register it to the typeDetailCollection
        if (type.getAliasSymbol()) {
            const typeDetail: TypeDetail = typeToTypeDetail(type, "type");
            typeDetailCollection.set(typeToString(type), typeDetail);
        }
        // In case of union or intersection type follow all intersection/union parts
        const types = type.isUnion()
            ? type.getUnionTypes()
            : type.getIntersectionTypes();
        types.forEach((t) =>
            generateTypeDetailCollection(t, typeDetailCollection)
        );
    }

    // TODO add more handling of special types like classes etc.

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
    for (const [key, value] of typeDetailCollection.entries()) {
        // type-aliases need some special output formatting since it is "type <type-alias-name> = <type>"
        // in all other cases, we simply print <type> <type-name> <type-declaration>
        if (value.type === "type") {
            result += `type ${key} = ${value.detailString};\n\n`;
        } else {
            result += `${value.type} ${key} ${value.detailString}\n\n`;
        }
    }
    return result;
}
