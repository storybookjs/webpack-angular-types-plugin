import { Symbol as tsSymbol } from "ts-morph";

export interface Property {
    name: string;
    alias?: string;
    defaultValue?: string;
    description: string;
    // TODO what about non-primitive types, should they be expanded so they are actually useful?
    type: string;
    typeDetails?: string;
    required: boolean;
}

export const Categories = [
    "inputs",
    "outputs",
    "propertiesWithoutDecorators",
] as const;
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

export type TsMorphSymbol = tsSymbol;
export type TypeDetailCollection = Map<string, TypeDetail>;

export type TypeKind = "interface" | "type" | "class" | "function";
