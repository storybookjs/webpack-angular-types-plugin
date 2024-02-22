import { FunctionInformation } from '../../types';
import { FunctionDeclaration } from 'ts-morph';
import { getJsDocsGroupDocs } from './ast-utils';
import { mapFunctionDeclaration } from './declaration-mappers';

export function generateFunctionsTypeInformation(
	functionDeclarations: FunctionDeclaration[],
	filePath: string,
): FunctionInformation[] {
	const functionsInformation: FunctionInformation[] = [];

	for (const functionDeclaration of functionDeclarations) {
		const name = functionDeclaration.getName();
		if (!name) {
			continue;
		}
		functionsInformation.push(generateFunctionInformation(functionDeclaration, name, filePath));
	}

	return functionsInformation;
}

export function generateFunctionInformation(
	functionDeclaration: FunctionDeclaration,
	name: string,
	filePath: string,
): FunctionInformation {
	return {
		name,
		modulePath: filePath,
		entity: mapFunctionDeclaration(functionDeclaration),
		groupBy: getJsDocsGroupDocs(functionDeclaration),
	};
}
