import { PropertyDeclaration } from 'ts-morph';
import { Entity } from '../../types';

/**
 * Checks whether a getter/setter input is already present in the given map
 */
export function getterOrSetterInputExists(entities: Map<string, Entity>, name: string): boolean {
	const entity = entities.get(name);
	return !!entity && entity.kind === 'input';
}

/**
 * Merges an array of entities. Convention: Entities are provided
 * in decreasing priority, i.e. fields from entities at the end of the input
 * array are overridden by entities on a lower index on the input array.
 */
export function mergeEntities(entities: Map<string, Entity>[]): Map<string, Entity> {
	if (entities.length === 1) {
		return entities[0];
	}
	const result = new Map<string, Entity>();

	// Merging maps of Entities from child class to base class. Entities from child class have higher priority.
	for (const entitiesToMerge of entities) {
		for (const entityToMerge of entitiesToMerge.values()) {
			if (getterOrSetterInputExists(result, entityToMerge.name)) {
				continue;
			}

			const overridingEntity = result.get(entityToMerge.name);
			if (!overridingEntity) {
				result.set(entityToMerge.name, entityToMerge);
			} else {
				result.set(entityToMerge.name, mergeEntity(overridingEntity, entityToMerge));
			}
		}
	}
	return result;
}

function mergeEntity(overridingEntity: Entity, baseClassEntity: Entity): Entity {
	return {
		name: overridingEntity.name || baseClassEntity.name,
		kind: overridingEntity.kind || baseClassEntity.kind,
		alias: overridingEntity.alias || baseClassEntity.alias,
		type: overridingEntity.type || baseClassEntity.type,
		typeDetails: overridingEntity.typeDetails || baseClassEntity.typeDetails,
		defaultValue: overridingEntity.defaultValue || baseClassEntity.defaultValue,
		description: overridingEntity.description || baseClassEntity.description,
		required: overridingEntity.required || baseClassEntity.required,
		modifier: overridingEntity.modifier || baseClassEntity.modifier,
		jsDocParams: overridingEntity.jsDocParams || baseClassEntity.jsDocParams,
		jsDocReturn: overridingEntity.jsDocReturn || baseClassEntity.jsDocReturn,
	};
}

export function isDeclarationOfType(declaration: PropertyDeclaration, typeName: string) {
	const type = declaration.getType();
	const symbol = declaration.getType().getSymbol();
	if (symbol) {
		return symbol.getName() === typeName;
	}
	return type.getText() === typeName;
}
