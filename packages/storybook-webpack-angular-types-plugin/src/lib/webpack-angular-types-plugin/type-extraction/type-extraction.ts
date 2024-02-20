import { Project } from 'ts-morph';
import {
	TypeInformationByCategory,
	FunctionInformation,
	InterfaceInformation,
	ConstantInformation,
	ClassInformation,
} from '../../types';
import { extractSupportedTypes } from './ast-utils';
import { generateClassesTypeInformation } from './class-type-extraction';
import { generateInterfacesTypeInformation } from './interface-type-extraction';
import { generateFunctionsTypeInformation } from './function-type-extraction';
import { generateConstantsTypeInformation } from './constant-type-extraction';

/**
 * Given a sourceFile and a typescript project, collects type information for all relevant classes and interfaces.
 */
export function generateTypeInformation(
	filePath: string,
	project: Project,
	propertiesToExclude: RegExp | undefined,
): TypeInformationByCategory {
	const sourceFile = project.getSourceFile(filePath);
	if (!sourceFile) {
		return {
			classesInformation: [],
			interfacesInformation: [],
			functionsInformation: [],
			constantsInformation: [],
		};
	}

	const { classDeclarations, interfaceDeclarations, functionDeclarations, variableStatements } =
		extractSupportedTypes(sourceFile);

	const classesInformation: ClassInformation[] = generateClassesTypeInformation(
		classDeclarations,
		filePath,
		propertiesToExclude,
	);

	const interfacesInformation: InterfaceInformation[] = generateInterfacesTypeInformation(
		interfaceDeclarations,
		filePath,
		propertiesToExclude,
	);

	const functionsInformation: FunctionInformation[] = generateFunctionsTypeInformation(
		functionDeclarations,
		filePath,
	);

	const constantsInformation: ConstantInformation[] = generateConstantsTypeInformation(
		variableStatements,
		filePath,
	);

	return {
		classesInformation,
		interfacesInformation,
		functionsInformation,
		constantsInformation,
	};
}
