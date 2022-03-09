export interface Property {
    name: string;
    alias?: string;
    defaultValue: string;
    description: string;
    // TODO what about non-primitive types, should they be expanded so they are actually useful?
    type: string;
}

export interface ClassProperties {
    inputs: Property[];
    outputs: Property[];
    propertiesWithoutDecorators: Property[];
}

export interface ClassInformation {
    name: string;
    modulePath: string;
    properties: ClassProperties;
}
