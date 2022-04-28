import { Module } from "webpack";

export interface WebpackAngularTypesPluginOptions {
    excludeProperties?: RegExp;
}

export type PropertyModifier = "getter" | "setter";

export interface Property {
    name: string;
    alias?: string;
    defaultValue?: string;
    description: string;
    type: string;
    typeDetails?: string;
    required: boolean;
    modifier?: PropertyModifier;
}

export const Categories = ["inputs", "outputs", "properties"] as const;
export type ClassPropertyCategories = typeof Categories[number];
export type ClassProperties = {
    [category in ClassPropertyCategories]: Property[];
};

export interface ClassInformation {
    name: string;
    modulePath: string;
    properties: ClassProperties;
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
