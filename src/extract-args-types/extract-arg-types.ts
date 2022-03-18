import { ArgType, TableAnnotation } from "@storybook/components";
import {
    STORYBOOK_ANGULAR_ARG_TYPES,
    STORYBOOK_COMPONENT_UUID,
} from "../constants";
import { ClassProperties, Property } from "../types";

// See https://github.com/storybookjs/storybook/blob/f4b3a880e7f00bd1b28e7691d45bcc1c41b1cafe/lib/components/src/blocks/ArgsTable/types.ts
interface ExtendedArgType extends ArgType {
    table: TableAnnotation;
}

type DirectiveType<TDirective> = new (...args: unknown[]) => TDirective;

const getAngularDirectiveProperties = (
    uuid: string
): ClassProperties | undefined => {
    // eslint-disable-next-line
    return (window as any)[STORYBOOK_ANGULAR_ARG_TYPES][uuid];
};

const mapPropToArgsTableProp = (
    prop: Property,
    category: string
): ExtendedArgType => ({
    name: prop.alias || prop.name,
    description: prop.description,
    defaultValue: prop.defaultValue,
    table: {
        defaultValue: {
            summary: prop.defaultValue || "---",
            required: prop.required,
        },
        category: category,
        jsDocTags: {
            // todo wait for 'jsDocTags' field
            /*params: [{name: 'jsDocTagParamName', description: 'JsDocTagParamDescription'}],
            returns: {
                description: 'jsdocTagReturn'
            }*/
        },
        type: {
            summary: prop.type,
            required: prop.required,
            detail: prop.typeDetails,
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

export const extractArgTypes = <TDirective>(
    directive: DirectiveType<TDirective>
): ArgType[] | undefined => {
    const props = getAngularDirectiveProperties(
        directive.prototype[STORYBOOK_COMPONENT_UUID]
    );
    if (!props) {
        return;
    }
    return mapPropsToArgsTableProps(props);
};
