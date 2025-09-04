import { STORYBOOK_ANGULAR_ARG_TYPES, STORYBOOK_COMPONENT_ID } from '../constants';
import { EntitiesByCategory, Entity, EntityKind, JsDocParam } from '../types';
import { Conditional } from 'storybook/internal/types';

/**
 * TODO During the update from Storybook 6 to Storybook 7.5, these types were not available anymore.
 * Discuss proper solution and replace these interfaces afterwards
 */

export interface JsDocParamDeprecated {
	deprecated?: string;
}

export interface JsDocReturns {
	description?: string;
}

export interface JsDocTags {
	params?: JsDocParam[];
	deprecated?: JsDocParamDeprecated;
	returns?: JsDocReturns;
}
export interface PropSummaryValue {
	summary: string;
	detail?: string;
	required?: boolean;
}

export type PropType = PropSummaryValue;

export interface TableAnnotation {
	type: PropType;
	jsDocTags?: JsDocTags;
	defaultValue?: PropDefaultValue;
	category?: string;
}
export type PropDefaultValue = PropSummaryValue;
export interface ArgType {
	name?: string;
	description?: string;
	defaultValue?: any;
	if?: Conditional;
	[key: string]: any;
}
// See https://github.com/storybookjs/storybook/blob/f4b3a880e7f00bd1b28e7691d45bcc1c41b1cafe/lib/components/src/blocks/ArgsTable/types.ts
interface ExtendedArgType extends ArgType {
	table: TableAnnotation;
}

type Type<T> = new (...args: unknown[]) => T;

const getEntities = (id: string): EntitiesByCategory | undefined => {
	// eslint-disable-next-line
	return (window as any)[STORYBOOK_ANGULAR_ARG_TYPES][id];
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
			returns: entity.jsDocReturn ? { description: entity.jsDocReturn } : undefined,
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
		const sortedEntities = entities.sort((a: Entity, b: Entity) =>
			(a.alias ?? a.name).localeCompare(b.alias ?? b.name),
		);
		for (const entity of sortedEntities) {
			argsTableProps.push(mapEntityToArgsTableProp(entity, categoryKey));
		}
	}

	return argsTableProps.sort(sortByEntityKind);
};

export function sortByEntityKind(a: ExtendedArgType, b: ExtendedArgType): number {
	return (
		getEntityKindPriority(a.table.category as EntityKind) -
		getEntityKindPriority(b.table.category as EntityKind)
	);
}

export function getEntityKindPriority(entityKind: EntityKind | undefined) {
	switch (entityKind) {
		case 'input':
			return 0;
		case 'output':
			return 1;
		case 'property':
			return 2;
		case 'method':
			return 3;
		default:
			return 4;
	}
}

export const extractArgTypes = <T>(type: Type<T>): ArgType[] | undefined => {
	const entities =
		typeof type === 'string'
			? getEntities(type)
			: getEntities(type.prototype[STORYBOOK_COMPONENT_ID]);
	if (!entities) {
		return;
	}
	return mapEntitiesToArgsTableProps(entities);
};
