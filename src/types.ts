import {
    GetAccessorDeclaration,
    MethodDeclaration,
    PropertyDeclaration,
    SetAccessorDeclaration,
    Symbol as TsSymbol,
    Type,
} from "ts-morph";
import { Module } from "webpack";

export interface WebpackAngularTypesPluginOptions {
    excludeProperties?: RegExp;
}

export type EntityModifier = "getter" | "setter";
export type EntityKind = "input" | "output" | "property" | "method";

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

export const _Categories = [
    "inputs",
    "outputs",
    "properties",
    "methods",
] as const;
export type Categories = typeof _Categories[number];
export type EntitiesByCategory = {
    [category in Categories]: Entity[];
};

export interface ClassInformation {
    name: string;
    modulePath: string;
    entitiesByCategory: EntitiesByCategory;
}

export interface TypeDetail {
    type: TypeKind;
    typeName: string;
    detailString: string;
}

export type TypeDetailCollection = Map<TsMorphSymbol, TypeDetail>;

export type TypeKind = "interface" | "type" | "class" | "function";

export interface ModuleInformation {
    path: string;
    module: Module;
}

export type TsMorphSymbol = TsSymbol;

export type GenericTypeMapping = WeakMap<TsMorphSymbol, Type>;

export interface EntityMappingParams {
    declaration:
        | PropertyDeclaration
        | SetAccessorDeclaration
        | GetAccessorDeclaration
        | MethodDeclaration;
    genericTypeMapping: GenericTypeMapping;
}
