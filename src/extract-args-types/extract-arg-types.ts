import { ArgType, TableAnnotation } from "@storybook/components";
import { STORYBOOK_ANGULAR_ARG_TYPES } from "../constants";
import { ClassProperties, Property } from "../types";

// See https://github.com/storybookjs/storybook/blob/f4b3a880e7f00bd1b28e7691d45bcc1c41b1cafe/lib/components/src/blocks/ArgsTable/types.ts
interface ExtendedArgType extends ArgType {
    table: TableAnnotation;
}

const getAngularDirectiveProperties = (
    name: string
): ClassProperties | undefined =>
    // eslint-disable-next-line
    (window as any)[STORYBOOK_ANGULAR_ARG_TYPES][name];

const mapPropToArgsTableProp = (
    prop: Property,
    category: string
): ExtendedArgType => ({
    name: prop.name,
    description: prop.description,
    defaultValue: prop.defaultValue,
    table: {
        defaultValue: {
            summary: prop.defaultValue,
            detail: undefined, // 'defailtValueDetail', todo show details for interfaces and types
            required: prop.required,
        },
        category: category,
        jsDocTags: {
            // todo wait for 'jsDocTags' field
            // params: [{name: 'jsDocTagParamName', description: 'JsDocTagParamDescription'}],
            // returns: {
            //     description: 'jsdocTagReturn'
            // }
        },
        type: {
            summary: prop.type,
            required: prop.required,
            detail: undefined, // "type detail", todo wait for type details for interfaces and types
        },
    },
});

const mapPropsToArgsTableProps = (
    directive: ClassProperties
): ExtendedArgType[] => {
    const argsTableProps: ExtendedArgType[] = [];

    for (const [categoryKey, properties] of Object.entries<Property[]>(
        directive
    )) {
        for (const property of properties) {
            argsTableProps.push(mapPropToArgsTableProp(property, categoryKey));
        }
    }

    return argsTableProps;
};

export const extractArgTypes = (directive: {
    name: string;
}): ArgType[] | undefined => {
    const props = getAngularDirectiveProperties(directive.name);
    if (!props) {
        return;
    }
    return mapPropsToArgsTableProps(props);
};
