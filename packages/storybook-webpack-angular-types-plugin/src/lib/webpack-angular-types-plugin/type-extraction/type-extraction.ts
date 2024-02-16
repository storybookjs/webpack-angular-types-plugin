import { Project } from 'ts-morph';
import { ClassInformation, InterfaceInformation } from '../../types';
import { extractSupportedTypes } from './ast-utils';
import { generateClassesTypeInformation } from './class-type-extraction';
import { generateInterfacesTypeInformation } from './interface-type-extraction';

/**
 * Given a sourceFile and a typescript project, collects type information for all relevant classes and interfaces.
 */
export function generateTypeInformation(
	filePath: string,
	project: Project,
	propertiesToExclude: RegExp | undefined,
): {
	classesInformation: ClassInformation[];
	interfacesInformation: InterfaceInformation[];
} {
	const sourceFile = project.getSourceFile(filePath);
	if (!sourceFile) {
		return { classesInformation: [], interfacesInformation: [] };
	}
	const { classDeclarations, interfaceDeclarations } = extractSupportedTypes(sourceFile);

	const classesInformation = generateClassesTypeInformation(
		classDeclarations,
		filePath,
		propertiesToExclude,
	);

	const interfacesInformation: InterfaceInformation[] = generateInterfacesTypeInformation(
		interfaceDeclarations,
		filePath,
		propertiesToExclude,
	);

	return { classesInformation, interfacesInformation };
}
