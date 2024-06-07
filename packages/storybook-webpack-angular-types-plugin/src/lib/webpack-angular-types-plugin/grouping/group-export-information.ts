import {
	ConstantInformation,
	ExportsInformation,
	FunctionInformation,
	GroupedExportInformation,
} from 'storybook-webpack-angular-types-plugin';

/**
 * Functions and constants can be annotated with "@include-docs" to collect them into a
 * single ArgsTable. Returns information grouped by the "groupBy" property.
 *
 * @param functionsInformation list of all functions
 * @param constantsInformation list of all constants
 */
export function groupExportInformation(
	functionsInformation: FunctionInformation[],
	constantsInformation: ConstantInformation[],
): GroupedExportInformation[] {
	const exportsInformationMap = new Map<string, ExportsInformation>();

	for (const functionInformation of functionsInformation) {
		addFunctionInformationToGroupedExports(exportsInformationMap, functionInformation);
	}

	for (const constantInformation of constantsInformation) {
		addConstantInformationToGroupedExports(exportsInformationMap, constantInformation);
	}

	const groupedExportsInformation: GroupedExportInformation[] = [];
	for (const [name, exportsInformation] of exportsInformationMap) {
		groupedExportsInformation.push({
			name,
			functionsInformation: exportsInformation.functionsInformation,
			constantsInformation: exportsInformation.constantsInformation,
		});
	}
	return groupedExportsInformation;
}

function addFunctionInformationToGroupedExports(
	exportsInformationMap: Map<string, ExportsInformation>,
	functionInformation: FunctionInformation,
) {
	addConstantLikeInformationToGroupedExports(
		exportsInformationMap,
		functionInformation,
		'functionsInformation',
	);
}

function addConstantInformationToGroupedExports(
	exportsInformationMap: Map<string, ExportsInformation>,
	functionInformation: ConstantInformation,
) {
	addConstantLikeInformationToGroupedExports(
		exportsInformationMap,
		functionInformation,
		'constantsInformation',
	);
}

function addConstantLikeInformationToGroupedExports(
	exportsInformationMap: Map<string, ExportsInformation>,
	constantLikeInformation: FunctionInformation | ConstantInformation,
	entryKey: 'functionsInformation' | 'constantsInformation',
) {
	const name = constantLikeInformation.name;

	exportsInformationMap.set(
		name,
		getNewExportsInformationMapEntry(constantLikeInformation, entryKey),
	);

	const groupBys = constantLikeInformation.groupBy;

	for (const groupBy of groupBys) {
		const groupByEntry = exportsInformationMap.get(groupBy);
		if (groupByEntry) {
			if (groupByEntry[entryKey].length) {
				groupByEntry[entryKey].push(constantLikeInformation);
			} else {
				groupByEntry[entryKey] = [constantLikeInformation];
			}
		} else {
			exportsInformationMap.set(
				groupBy,
				getNewExportsInformationMapEntry(constantLikeInformation, entryKey),
			);
		}
	}
}

function getNewExportsInformationMapEntry(
	constantLikeInformation: FunctionInformation | ConstantInformation,
	entryKey: 'functionsInformation' | 'constantsInformation',
): ExportsInformation {
	return {
		functionsInformation: [],
		constantsInformation: [],
		[entryKey]: [constantLikeInformation],
	};
}
