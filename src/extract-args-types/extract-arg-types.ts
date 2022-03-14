import { ArgType, TableAnnotation } from "@storybook/components";
import { ClassProperties, Property } from "../types";

// See https://github.com/storybookjs/storybook/blob/f4b3a880e7f00bd1b28e7691d45bcc1c41b1cafe/lib/components/src/blocks/ArgsTable/types.ts
interface ExtendedArgType extends ArgType {
    table: TableAnnotation;
}

const getAngularDirectiveProperties = (
    name: string
): ClassProperties | undefined =>
    // eslint-disable-next-line no-undef
    (window as any).STORYBOOK_ANGULAR_ARG_TYPES[name];

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
            required: false, // todo wait for 'required' field
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
            required: false,
            detail: undefined, // "type detail", todo wait for type details for interfaces and types
        },
    },
});

// eslint-disable-next-line
const mapPropsToArgsTableProps = (
    directive: ClassProperties
): ExtendedArgType[] => {
    const argsTableProps: ExtendedArgType[] = [];

    for (const [categoryKey, category] of Object.entries(directive)) {
        for (const [, property] of Object.entries<Property>(category)) {
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
    // eslint-disable-next-line consistent-return
    return mapPropsToArgsTableProps(props);
};
