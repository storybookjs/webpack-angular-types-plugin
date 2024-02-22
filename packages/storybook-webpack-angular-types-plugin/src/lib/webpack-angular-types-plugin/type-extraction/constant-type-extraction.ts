import { ConstantInformation } from 'storybook-webpack-angular-types-plugin';
import { VariableStatement } from 'ts-morph';
import { mapVariableDeclaration } from './declaration-mappers';
import { getJsDocsGroupDocs, getVariableName } from './ast-utils';

export function generateConstantsTypeInformation(
	variableStatements: VariableStatement[],
	filePath: string,
): ConstantInformation[] {
	const constantInformation: ConstantInformation[] = [];

	for (const variableStatement of variableStatements) {
		constantInformation.push(
			generateConstantTypeInformation(
				variableStatement,
				getVariableName(variableStatement),
				filePath,
			),
		);
	}

	return constantInformation;
}

export function generateConstantTypeInformation(
	variableStatement: VariableStatement,
	name: string,
	filePath: string,
): ConstantInformation {
	return {
		name,
		modulePath: filePath,
		entity: mapVariableDeclaration(variableStatement),
		groupBy: getJsDocsGroupDocs(variableStatement),
	};
}
