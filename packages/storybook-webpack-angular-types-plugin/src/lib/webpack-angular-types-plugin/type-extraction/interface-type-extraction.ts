import { EntitiesByCategory, Entity, InterfaceInformation } from '../../types';
import { InterfaceDeclaration } from 'ts-morph';
import { EXCLUDE_DOCS_JS_DOCS_PARAM, groupBy } from '../utils';
import { collectBaseInterfaces, getJsDocsIncludeDocsAliases, hasJsDocsTag } from './ast-utils';
import { mapSignatureToEntity } from './signature-mappers';
import { getCategoryFromEntityKind, getterOrSetterInputExists, mergeEntities } from './utils';

/**
 * Collects all interface entities (property and method signatures) of a interfaceDeclaration
 */
function getInterfaceEntities(
	interfaceDeclaration: InterfaceDeclaration,
	propertiesToExclude: RegExp | undefined,
): Map<string, Entity> {
	const properties = interfaceDeclaration.getProperties();
	const methods = interfaceDeclaration.getMethods();
	const entities = new Map<string, Entity>();

	for (const signature of [...properties, ...methods]) {
		if (hasJsDocsTag(signature, EXCLUDE_DOCS_JS_DOCS_PARAM)) {
			continue;
		}

		// do not include the property if it passes the exclusion test
		if (propertiesToExclude?.test(signature.getName())) {
			continue;
		}
		const entity = mapSignatureToEntity({ signature });

		// If there already is an input getter/setter declaration, do not overwrite
		// the existing mapping
		if (getterOrSetterInputExists(entities, entity.name)) {
			continue;
		}

		entities.set(entity.name, entity);
	}
	return entities;
}

export function generateInterfacesTypeInformation(
	interfaceDeclarations: InterfaceDeclaration[],
	filePath: string,
	propertiesToExclude: RegExp | undefined,
): InterfaceInformation[] {
	const interfacesInformation: InterfaceInformation[] = [];

	for (const interfaceDeclaration of interfaceDeclarations) {
		const name = interfaceDeclaration.getName();
		if (!name) {
			continue;
		}
		interfacesInformation.push(
			generateInterfaceTypeInformation(
				interfaceDeclaration,
				name,
				filePath,
				propertiesToExclude,
			),
		);
	}

	return interfacesInformation;
}

export function generateInterfaceTypeInformation(
	interfaceDeclaration: InterfaceDeclaration,
	name: string,
	filePath: string,
	propertiesToExclude: RegExp | undefined,
): InterfaceInformation {
	const baseInterfaces = collectBaseInterfaces(interfaceDeclaration);
	const allInterfaces = [interfaceDeclaration, ...baseInterfaces];

	const interfaceEntities = allInterfaces.map((interfaceDeclaration: InterfaceDeclaration) =>
		getInterfaceEntities(interfaceDeclaration, propertiesToExclude),
	);
	const mergedInterfaceEntities = mergeEntities(interfaceEntities);

	const includeDocsAliases = getJsDocsIncludeDocsAliases(interfaceDeclaration);

	const aliases = Array.from(new Set([name, ...includeDocsAliases]));

	return {
		name,
		aliases,
		modulePath: filePath,
		entitiesByCategory: groupBy(mergedInterfaceEntities, (entity) =>
			getCategoryFromEntityKind(entity.kind),
		) as EntitiesByCategory,
	};
}
