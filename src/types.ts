import { Module } from "webpack";

export interface WebpackAngularTypesPluginOptions {
    excludeProperties?: RegExp;
}

export type EntityModifier = "getter" | "setter";
export type EntityKind = "input" | "output" | "property" | "method";

export interface Entity {
    name: string;
    kind: EntityKind;
    alias?: string;
    defaultValue?: string;
    description: string;
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

export type TypeDetailCollection = Map<string, TypeDetail>;

export type TypeKind = "interface" | "type" | "class" | "function";

export interface ModuleInformation {
    path: string;
    module: Module;
}
