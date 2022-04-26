import { Type } from "ts-morph";
import { wrapInBraces, wrapInCurlyBraces } from "../utils";
import { isFunctionType } from "./type-details";

/*
 * Removes the import("...")-part, which is sometimes included when types are
 * resolved from other modules
 */
function truncateImportPart(typeStr: string): string {
    const regex = /import\(.+\)\./g;
    return typeStr.replace(regex, "");
}

/*
 * Given an array of type strings, it is searched if both the "true" and "false"
 * boolean literal types appear in the array. If so, they are replaced by "boolean"
 */
function replaceTrueFalseUnionByBooleanIfExists(union: string[]): string[] {
    // replace true/false by boolean
    let res = [...union];
    const trueIndex = res.indexOf("true");
    const falseIndex = res.indexOf("false");
    if (trueIndex > -1 && falseIndex > -1) {
        res = union.filter(
            (elem, index) => index !== trueIndex && index !== falseIndex
        );
        res.push("boolean");
    }
    return res;
}

/*
 * Moves "undefined"/"null" to the end of the string array, if present
 */
function pushUndefinedAndNullToEnd(arr: string[]): string[] {
    const res = [...arr];
    const nullIndex = res.indexOf("null");
    if (nullIndex > -1) {
        res.splice(nullIndex, 1);
        res.push("null");
    }
    const undefinedIndex = res.indexOf("undefined");
    if (undefinedIndex > -1) {
        res.splice(undefinedIndex, 1);
        res.push("undefined");
    }
    return res;
}

function printUnionOrIntersection(
    type: Type,
    expandType: boolean,
    level: number
): string {
    if (!expandType && type.getAliasSymbol()) {
        return truncateImportPart(type.getText());
    }
    const types = type.isUnion()
        ? type.getUnionTypes()
        : type.getIntersectionTypes();
    const joinSymbol = type.isUnion() ? " | " : " & ";
    let res = types.map((t) => printType(t, false, level + 1));
    // ts-morph evaluates the boolean type as a union type of boolean literals (true | false)
    // for printing, we want to display "boolean"
    res = replaceTrueFalseUnionByBooleanIfExists(res);
    res = pushUndefinedAndNullToEnd(res);
    const joinedRes = res.join(joinSymbol);
    return level > 0 ? wrapInBraces(joinedRes) : joinedRes;
}

function printInterface(
    type: Type,
    expandType: boolean,
    level: number
): string {
    if (!expandType) {
        return truncateImportPart(type.getText());
    }
    const res: string[] = [];
    for (const property of type.getProperties()) {
        const propName = property.getName();
        const propType = property.getValueDeclarationOrThrow().getType();
        // the whitespaces at the beginning are for indentation
        res.push(`  ${propName}: ${printType(propType, false, level)};`);
    }
    return wrapInCurlyBraces(res.join("\n"));
}

function printFunction(type: Type, expandType: boolean, level: number): string {
    if (!expandType && type.getAliasSymbol()) {
        return truncateImportPart(type.getText());
    }
    const css = type.getCallSignatures();
    const res: string[] = [];
    for (const cs of css) {
        const retTypeString = printType(cs.getReturnType(), false, level + 1);
        const paramStrings: string[] = [];
        for (const param of cs.getParameters()) {
            const paramName = param.getName();
            const paramType = printType(
                param.getValueDeclaration()?.getType() ||
                    param.getDeclaredType(),
                false,
                level + 1
            );
            const paramString = `${paramName}: ${paramType}`;
            paramStrings.push(paramString);
        }
        const csString = `(${paramStrings.join(", ")}): ${retTypeString};`;
        res.push(csString);
    }
    return res.join("\n");
}

/*
 * Gets a printable string from a type.
 */
export function printType(type: Type, expandType: boolean, level = 0): string {
    if (type.isUnion() || type.isIntersection()) {
        return printUnionOrIntersection(type, expandType, level);
        // interfaces are only expanded on the root level
    } else if (type.isInterface()) {
        return printInterface(type, expandType, level);
    } else if (isFunctionType(type)) {
        return printFunction(type, expandType, level);
    }
    return truncateImportPart(type.getText());
}
