import {
    ClassDeclaration,
    DecoratableNode,
    JSDocableNode,
    JSDocTag,
    PropertyDeclaration,
    SetAccessorDeclaration,
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
 * Gets the jsDocs description of a node.
 */
export function getJsDocsDescription(node: JSDocableNode): string {
    return node.getJsDocs()[0]?.getDescription() || "";
}

/**
 * Gets the jsDocs params of a node
 */
export function getJsDocsParams(node: JSDocableNode): JSDocTag[] {
    return (
        node
            .getJsDocs()[0]
            ?.getTags()
            .filter((tag) => tag.getTagName() === "param") || []
    );
}

/**
 * Gets the return type description from the jsDocs of a node
 */
export function getJsDocsReturnDescription(node: JSDocableNode): string {
    return (
        node
            .getJsDocs()[0]
            ?.getTags()
            ?.find((tag) => tag.getTagName() === "return")
            ?.getText() || ""
    );
}

/**
 * Splits a jsDoc tag into the prefix, e.g. @param test, and the description of
 * the param.
 */
function splitTag(
    tag: JSDocTag | string,
    prefixRegex: RegExp
): [string, string] {
    let tagText: string;
    if (tag instanceof JSDocTag) {
        tagText = tag.getText() || "";
    } else {
        tagText = tag;
    }
    const tagPrefix = tagText.match(prefixRegex)?.[0] || "";
    // sometimes a random \n* is contained in the tagText produced by ts-morph
    // in this case filter it out, so that it does not mess with the markdown
    // output
    const newLineIndex = tagText.indexOf("\n");
    const endIndex = newLineIndex === -1 ? tagText.length : newLineIndex;
    const tagDescription = tagText.substring(tagPrefix.length + 1, endIndex);
    return [tagPrefix, tagDescription];
}

/**
 * Formats a jsDoc tag.
 */
function formatTag(tag: JSDocTag | string, prefixRegex: RegExp): string {
    const [prefix, description] = splitTag(tag, prefixRegex);
    return `&nbsp;&nbsp;&nbsp;**${prefix}** ${description}`;
}

/**
 * Formats a jsDoc for a function, including params and return type
 */
export function getFunctionJsDocsDescription(node: JSDocableNode): string {
    const description = getJsDocsDescription(node);
    const formattedParams = getJsDocsParams(node)
        .map((n) => formatTag(n, /@\S+ \S+/))
        .join("<br>");
    const formattedReturn = formatTag(getJsDocsReturnDescription(node), /@\S+/);
    return `${description}<br>${formattedParams}<br>${formattedReturn}`;
}

/*
 * Gets a @default param which acts as an override of the initializer of a node
 */
export function getJsDocsDefaultValueOverride(
    node: JSDocableNode
): string | undefined {
    return node
        .getJsDocs()[0]
        ?.getTags()
        ?.find((tag) => tag.getTagName() === "default")
        ?.getCommentText();
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

/**
 * Checks if the given type is evaluable, i.e. no type that needs a function
 * invocation to be evaluated
 */
export function isEvaluableType(type: Type): boolean {
    return type.isLiteral();
}

/**
 * Gets the default value of a property declaration
 */
export function getDefaultValue(
    decl: PropertyDeclaration | SetAccessorDeclaration
): string | undefined {
    // check for defaultValue override
    const defaultValueOverride = getJsDocsDefaultValueOverride(decl);
    if (defaultValueOverride) {
        return defaultValueOverride;
    }

    // otherwise use the initializer for properties (does not exist on setAccessors)
    if (decl instanceof PropertyDeclaration) {
        const initializer = decl.getInitializer();
        const initializerType = initializer?.getType();
        if (
            initializer &&
            initializerType &&
            isEvaluableType(initializerType)
        ) {
            return initializer.getText();
        }
    }
    return undefined;
}
