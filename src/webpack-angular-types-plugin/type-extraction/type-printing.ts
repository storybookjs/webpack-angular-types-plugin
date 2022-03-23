import { Type } from "ts-morph";
import { wrapInBraces, wrapInCurlyBraces } from "../utils";

/*
 * Removes the import("...")-part, which is sometimes included when types are
 * resolved from other modules
 */
function truncateImportPart(typeStr: string): string {
    const regex = /import\(.+\)\./g;
    return typeStr.replace(regex, "");
}

/*
 * Gets a printable string from a type. In contrast to the typeToString method,
 * the apparent/actual type is generated. Examples: For an interface, the actual
 * members and their types are collected.
 */
export function typeToExpandedString(type: Type, level = 0): string {
    if (type.isUnion() || type.isIntersection()) {
        const types = type.isUnion()
            ? type.getUnionTypes()
            : type.getIntersectionTypes();
        const joinSymbol = type.isUnion() ? " | " : " & ";
        const res = types
            .map((t) => typeToExpandedString(t, level + 1))
            .join(joinSymbol);
        return level > 0 ? wrapInBraces(res) : res;
        // interfaces are only expanded on the root level
    } else if (type.isInterface() && level === 0) {
        const res: string[] = [];
        for (const property of type.getProperties()) {
            const propName = property.getName();
            const propType = property.getValueDeclarationOrThrow().getType();
            // the whitespaces at the beginning are for indentation
            res.push(
                `  ${propName}: ${typeToExpandedString(propType, level)};`
            );
        }
        return wrapInCurlyBraces(res.join("\n"));
    } else {
        return truncateImportPart(type.getText());
    }
}

/*
 * Gets the name of the type as a string. In contrast to typeToExpandedString
 * this method only gets the name/alias-name. E.g. type X = boolean | string
 * will return "X" and not "boolean | string"
 */
export function typeToString(type: Type): string {
    return truncateImportPart(type.getText());
}
