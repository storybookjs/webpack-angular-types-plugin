import {
	ClassDeclaration,
	DecoratableNode,
	InterfaceDeclaration,
	JSDoc,
	JSDocableNode,
	JSDocTag,
	Node,
	PropertyDeclaration,
	SetAccessorDeclaration,
	SourceFile,
	Type,
} from 'ts-morph';
import { JsDocParam } from '../../types';
import { stripQuotes } from '../utils';

/**
 * Collects all Class- and InterfaceDeclarations from the given SourceFile that have a
 * @Component(), @Directive(), @Pipe() or @Injectable() decorator or ar annotated with
 * "@include-docs".
 */
export function extractSupportedTypes(sourceFile: SourceFile): {
	classDeclarations: ClassDeclaration[];
	interfaceDeclarations: InterfaceDeclaration[];
} {
	const classDeclarations = getClassDeclarations(sourceFile);
	const interfaceDeclarations = getInterfaceDeclarations(sourceFile);

	return { classDeclarations, interfaceDeclarations };
}

function getClassDeclarations(sourceFile: SourceFile): ClassDeclaration[] {
	return sourceFile
		.getClasses()
		.filter(
			(classDeclaration: ClassDeclaration) =>
				!classDeclaration.isAbstract() &&
				(!!(
					classDeclaration.getDecorator('Component') ||
					classDeclaration.getDecorator('Directive') ||
					classDeclaration.getDecorator('Pipe') ||
					classDeclaration.getDecorator('Injectable')
				) ||
					hasJsDocsTag(classDeclaration.getJsDocs(), 'include-docs')) &&
				!hasJsDocsTag(classDeclaration.getJsDocs(), 'exclude-docs'),
		)
		.reduce((acc: ClassDeclaration[], val: ClassDeclaration) => acc.concat(val), []);
}

function getInterfaceDeclarations(sourceFile: SourceFile): InterfaceDeclaration[] {
	return sourceFile
		.getInterfaces()
		.filter((interfaceDeclaration: InterfaceDeclaration) =>
			hasJsDocsTag(interfaceDeclaration.getJsDocs(), 'include-docs'),
		)
		.reduce((acc: InterfaceDeclaration[], val: InterfaceDeclaration) => acc.concat(val), []);
}

/*
 * Returns the alias name from the @Input()/@Output() decorator of a node.
 * Returns undefined if no alias or decorator is available.
 */
export function retrieveInputOutputDecoratorAlias(node: DecoratableNode): string | undefined {
	for (const decoratorToCheck of ['Input', 'Output']) {
		if (node.getDecorator(decoratorToCheck)) {
			const decoratorArgs = node.getDecorator(decoratorToCheck)?.getArguments();
			if (decoratorArgs && decoratorArgs.length === 1) {
				return stripQuotes(decoratorArgs[0].getText());
			}
		}
	}
	return undefined;
}

/**
 * Gets the jsDocs description of a node.
 */
export function getJsDocsDescription(node: JSDocableNode): string | undefined {
	return node.getJsDocs()[0]?.getDescription();
}

/**
 * Gets the jsDocs params of a node
 */
export function getJsDocsParams(node: JSDocableNode): JsDocParam[] {
	return (
		node
			.getJsDocs()[0]
			?.getTags()
			.filter((tag) => tag.getTagName() === 'param')
			.map((tag) => getJsDocParam(tag)) || []
	);
}

/**
 * Checks if jsDocs contain a specific tag
 * @param jsDocs JSDocs array
 * @param tagName name of the JSDoc tag
 */
export function hasJsDocsTag(jsDocs: JSDoc[], tagName: string): boolean {
	const jsDocParams = jsDocs.flatMap((jsDoc) => jsDoc.getTags().flatMap((t) => t.getTagName()));
	return jsDocParams.includes(tagName);
}

/**
 * Gets the return type description from the jsDocs of a node
 */
export function getJsDocsReturnDescription(node: JSDocableNode): string | undefined {
	const text = node
		.getJsDocs()[0]
		?.getTags()
		?.find((tag) => tag.getTagName() === 'return')
		?.getText();
	if (!text) {
		return undefined;
	}
	return text.substring(text.indexOf(' ') + 1);
}

/**
 * Splits a jsDoc tag into the prefix, e.g. @param test, and the description of
 * the param.
 */
function getJsDocParam(tag: JSDocTag): JsDocParam {
	const split = tag.getText().split(' ');
	const parts = split.slice(0, 2).concat(split.slice(2).join(' '));
	let description = parts[2];
	const eolArtifactIndex = description.match(/\n\s*/)?.index || -1;
	// ts-morph adds the new-line, as-well as the succeeding asterisk to each tag.
	// therefore we need to remove it manually
	if (eolArtifactIndex !== -1) {
		description = description.substring(0, eolArtifactIndex);
	}
	return {
		name: parts[1],
		description,
	};
}

/**
 * Gets a @default param which acts as an override of the initializer of a node
 */
export function getJsDocsDefaultValue(node: JSDocableNode): string | undefined {
	return node
		.getJsDocs()[0]
		?.getTags()
		?.find((tag) => tag.getTagName() === 'default')
		?.getCommentText();
}

/**
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

/**
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
 * Given a starting InterfaceDeclaration, recursively collect all base types
 */
export function collectBaseInterfaces(
	interfaceDeclaration: InterfaceDeclaration,
): InterfaceDeclaration[] {
	const baseInterfaceDeclarations: InterfaceDeclaration[] = [];

	let currentDeclarations = interfaceDeclaration.getBaseDeclarations();
	while (currentDeclarations.length) {
		const innerDeclarations: InterfaceDeclaration[] = [];
		for (const currentDeclaration of currentDeclarations) {
			if (Node.isInterfaceDeclaration(currentDeclaration)) {
				baseInterfaceDeclarations.push(currentDeclaration);
				innerDeclarations.push(currentDeclaration);
			}
		}
		currentDeclarations = innerDeclarations.flatMap((declaration) =>
			declaration.getBaseDeclarations(),
		);
	}
	return baseInterfaceDeclarations;
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
	decl: PropertyDeclaration | SetAccessorDeclaration,
): string | undefined {
	// check for defaultValue override
	const defaultValueOverride = getJsDocsDefaultValue(decl);
	if (defaultValueOverride) {
		return defaultValueOverride;
	}

	// otherwise use the initializer for properties (does not exist on setAccessors)
	if (decl instanceof PropertyDeclaration) {
		const initializer = decl.getInitializer();
		const initializerType = initializer?.getType();
		if (initializer && initializerType && isEvaluableType(initializerType)) {
			return initializer.getText();
		}
	}
	return undefined;
}
