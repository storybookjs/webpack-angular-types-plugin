import {
    ClassDeclaration,
    DecoratableNode,
    JSDocableNode,
    SourceFile,
    Type,
} from "ts-morph";
import { stripQuotes } from "../utils";

/*
 * Collects all ClassDeclarations from the given SourceFile that have a
 * @Component() or @Directive decorator
 */
export function extractComponentOrDirectiveAnnotatedClasses(
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

/*
 * Returns the alias name from the @Input()/@Output() decorator of a node.
 * Returns undefined if no alias or decorator is available.
 */
export function retrieveInputOutputDecoratorAlias(
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

/*
 * Gets the jsDocs of a node.
 */
export function getJsDocs(node: JSDocableNode): string {
    // TODO this needs to be properly implemented. Maybe return an object
    //      with pre-defined fields like description, params, return etc.
    return (
        node
            .getJsDocs()
            .map((doc) => doc.getCommentText())
            .join("\n") || ""
    );
}

/*
 * Checks if the given type is required. This is either the case when the optional
 * modifier (?) is omitted, or when "undefined" is part of the root level type
 * (either type = undefined or type = typeA | undefined | typeB)
 */
export function isTypeRequired(type: Type): boolean {
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

/*
 * Given a starting ClassDeclaration, recursively collect all base classes
 * (and the base classes of the base classes etc.).
 */
export function collectBaseClasses(cls: ClassDeclaration): ClassDeclaration[] {
    const bases: ClassDeclaration[] = [];
    let currentClass = cls.getBaseClass();
    while (currentClass) {
        bases.push(currentClass);
        currentClass = currentClass.getBaseClass();
    }
    return bases;
}
