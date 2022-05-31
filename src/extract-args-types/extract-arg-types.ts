import { ArgType, TableAnnotation } from "@storybook/components";
import {
    STORYBOOK_ANGULAR_ARG_TYPES,
    STORYBOOK_COMPONENT_ID,
} from "../constants";
import { EntitiesByCategory, Entity } from "../types";

// See https://github.com/storybookjs/storybook/blob/f4b3a880e7f00bd1b28e7691d45bcc1c41b1cafe/lib/components/src/blocks/ArgsTable/types.ts
interface ExtendedArgType extends ArgType {
    table: TableAnnotation;
}

type DirectiveType<TDirective> = new (...args: unknown[]) => TDirective;

const getAngularDirectiveEntities = (
    componentId: string
): EntitiesByCategory | undefined => {
    // eslint-disable-next-line
    return (window as any)[STORYBOOK_ANGULAR_ARG_TYPES][componentId];
};

const mapEntityToArgsTableProp = (
    entity: Entity,
    category: string
): ExtendedArgType => ({
    name: entity.alias || entity.name,
    description: entity.description,
    defaultValue: entity.defaultValue,
    table: {
        defaultValue: {
            summary: entity.defaultValue || "",
            required: entity.required,
        },
        category: category,
        jsDocTags: {
            params: entity.jsDocParams,
            returns: entity.jsDocReturn
                ? {
                      description: entity.jsDocReturn,
                  }
                : undefined,
        },
        type: {
            summary: entity.type || "",
            required: entity.required,
            detail: entity.typeDetails,
        },
    },
});

const mapEntitiesToArgsTableProps = (
    entitiesByCategory: EntitiesByCategory
): ExtendedArgType[] => {
    const argsTableProps: ExtendedArgType[] = [];

    for (const [categoryKey, entities] of Object.entries<Entity[]>(
        entitiesByCategory
    )) {
        for (const entity of entities) {
            argsTableProps.push(mapEntityToArgsTableProp(entity, categoryKey));
        }
    }

    return argsTableProps;
};

export const extractArgTypes = <TDirective>(
    directive: DirectiveType<TDirective>
): ArgType[] | undefined => {
    const entities = getAngularDirectiveEntities(
        directive.prototype[STORYBOOK_COMPONENT_ID]
    );
    if (!entities) {
        return;
    }
    return mapEntitiesToArgsTableProps(entities);
};
