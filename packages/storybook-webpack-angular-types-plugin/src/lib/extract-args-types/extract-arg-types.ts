import { ArgType, TableAnnotation } from '@storybook/components';
import { STORYBOOK_ANGULAR_ARG_TYPES, STORYBOOK_COMPONENT_ID } from '../constants';
import { EntitiesByCategory, Entity } from '../types';

// See https://github.com/storybookjs/storybook/blob/f4b3a880e7f00bd1b28e7691d45bcc1c41b1cafe/lib/components/src/blocks/ArgsTable/types.ts
interface ExtendedArgType extends ArgType {
	table: TableAnnotation;
}

type DirectiveType<TDirective> = new (...args: unknown[]) => TDirective;

const getAngularDirectiveEntities = (componentId: string): EntitiesByCategory | undefined => {
	// eslint-disable-next-line
	return (window as any)[STORYBOOK_ANGULAR_ARG_TYPES][componentId];
};

const mapEntityToArgsTableProp = (entity: Entity, category: string): ExtendedArgType => ({
	name: entity.alias || entity.name,
	description: entity.description,
	defaultValue: entity.defaultValue,
	table: {
		defaultValue: {
			// em dash (\u2014) is used as fallback if no default is specified
			summary: entity.defaultValue || '\u2014',
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
			summary: entity.type || '',
			required: entity.required,
			detail: entity.typeDetails,
		},
	},
});

const mapEntitiesToArgsTableProps = (entitiesByCategory: EntitiesByCategory): ExtendedArgType[] => {
	const argsTableProps: ExtendedArgType[] = [];

	for (const [categoryKey, entities] of Object.entries<Entity[]>(entitiesByCategory)) {
		const sortedEntities = entities.sort((a: Entity, b: Entity) => (a.alias ?? a.name).localeCompare(b.alias ?? b.name));
		for (const entity of sortedEntities) {
			argsTableProps.push(mapEntityToArgsTableProp(entity, categoryKey));
		}
	}

	return argsTableProps;
};

export const extractArgTypes = <TDirective>(
	directive: DirectiveType<TDirective>,
): ArgType[] | undefined => {
	const entities = getAngularDirectiveEntities(directive.prototype[STORYBOOK_COMPONENT_ID]);
	if (!entities) {
		return;
	}
	return mapEntitiesToArgsTableProps(entities);
};
