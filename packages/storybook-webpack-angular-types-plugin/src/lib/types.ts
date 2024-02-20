import {
	ClassDeclaration,
	ExportDeclaration,
	FunctionDeclaration,
	GetAccessorDeclaration,
	InterfaceDeclaration,
	MethodDeclaration,
	MethodSignature,
	PropertyDeclaration,
	PropertySignature,
	SetAccessorDeclaration,
	Signature,
	Symbol as TsSymbol,
	Type,
	VariableDeclaration,
	VariableStatement,
} from 'ts-morph';
import { Module } from 'webpack';

export interface WebpackAngularTypesPluginOptions {
	excludeProperties?: RegExp;
	tsconfigPath?: string;
}

export type EntityModifier = 'getter' | 'setter';
export type EntityKind = 'input' | 'output' | 'property' | 'method';

export interface JsDocParam {
	name: string;
	description: string;
}

export interface Entity {
	name: string;
	kind: EntityKind;
	alias?: string;
	defaultValue?: string;
	description: string;
	jsDocParams?: JsDocParam[];
	jsDocReturn?: string;
	type?: string;
	typeDetails?: string;
	required: boolean;
	modifier?: EntityModifier;
}

export const _Categories = ['inputs', 'outputs', 'properties', 'methods'] as const;
export type Categories = (typeof _Categories)[number];
export type EntitiesByCategory = {
	[category in Categories]: Entity[];
};

export type ClassInformation = CommonClassLikeInformation;
export type InterfaceInformation = CommonClassLikeInformation;

interface CommonClassLikeInformation extends CommonInformation {
	entitiesByCategory: EntitiesByCategory;
}

export type FunctionInformation = CommonConstantLikeInformation;
export type ConstantInformation = CommonConstantLikeInformation;

interface CommonConstantLikeInformation extends CommonInformation {
	entity: Entity;
	groupBy: string[];
}

interface CommonInformation {
	name: string;
	modulePath: string;
}

export interface GroupedExportInformation extends ExportsInformation {
	name: string;
}

export interface ExportsInformation {
	functionsInformation: FunctionInformation[];
	constantsInformation: ConstantInformation[];
}

export interface DeclarationsByCategory {
	classDeclarations: ClassDeclaration[];
	interfaceDeclarations: InterfaceDeclaration[];
	functionDeclarations: FunctionDeclaration[];
	variableStatements: VariableStatement[];
}

export interface TypeInformationByCategory {
	classesInformation: ClassInformation[];
	interfacesInformation: InterfaceInformation[];
	functionsInformation: FunctionInformation[];
	constantsInformation: ConstantInformation[];
}

export interface TypeDetail {
	type: TypeKind;
	typeName: string;
	detailString: string;
}

export type TypeDetailCollection = Map<TsMorphSymbol, TypeDetail>;

export type TypeKind = 'interface' | 'type' | 'class' | 'function';

export interface ModuleInformation {
	path: string;
	module: Module;
}

export type TsMorphSymbol = TsSymbol;

export type GenericTypeMapping = WeakMap<TsMorphSymbol, Type>;

export interface DeclarationToEntityMappingParams {
	declaration:
		| PropertyDeclaration
		| SetAccessorDeclaration
		| GetAccessorDeclaration
		| MethodDeclaration;
	genericTypeMapping: GenericTypeMapping;
}

export interface SignatureToEntityMappingParams {
	signature: PropertySignature | MethodSignature;
}
