import { getTsconfig, TsConfigJsonResolved } from 'get-tsconfig';
import * as micromatch from 'micromatch';
import * as path from 'path';
import * as process from 'process';
import { Project } from 'ts-morph';
import { Compiler, Module } from 'webpack';
import { DEFAULT_TS_CONFIG_PATH, PLUGIN_NAME } from '../constants';
import {
	ClassInformation,
	ConstantInformation,
	ExportsInformation,
	FunctionInformation,
	GroupedExportInformation,
	InterfaceInformation,
	ModuleInformation,
	WebpackAngularTypesPluginOptions,
} from '../types';
import { getGlobalUniqueId } from './class-id-registry';
import { CodeDocDependency, CodeDocDependencyTemplate } from './templating/code-doc-dependency';
import {
	getClassArgCodeBlock,
	getNonClassArgCodeBlock,
} from './templating/arg-code-block-templates';
import { getPrototypeClassIdCodeBlock } from './templating/prototype-class-id-code-block-template';
import { generateTypeInformation } from './type-extraction/type-extraction';
import { parseModuleKind, parseModuleResolution, parseScriptTarget } from './ts-morph-helpers';

export class WebpackAngularTypesPlugin {
	// A queue for modules, that should be processed by the plugin in the next seal-hook
	private moduleQueue: Module[] = [];

	private readonly tsconfigPath: string;
	private readonly tsconfig: TsConfigJsonResolved;

	private readonly includedPaths: string[];

	constructor(private options: WebpackAngularTypesPluginOptions = {}) {
		this.tsconfigPath = this.options.tsconfigPath ?? DEFAULT_TS_CONFIG_PATH;
		this.tsconfig = getTsconfig(this.tsconfigPath)?.config ?? {};

		this.includedPaths = this.getIncludedPathsFromTsconfig(this.tsconfigPath, this.tsconfig);
	}

	apply(compiler: Compiler) {
		compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
			compilation.dependencyTemplates.set(CodeDocDependency, new CodeDocDependencyTemplate());

			compilation.hooks.buildModule.tap(PLUGIN_NAME, (module) => {
				if (this.isModuleProcessable(module)) {
					this.moduleQueue.push(module);
				}
			});

			compilation.hooks.seal.tap(PLUGIN_NAME, () => {
				const smallTsProject = new Project({
					compilerOptions: {
						module: parseModuleKind(this.tsconfig.compilerOptions?.module),
						target: parseScriptTarget(this.tsconfig.compilerOptions?.target),
						moduleResolution: parseModuleResolution(
							this.tsconfig.compilerOptions?.moduleResolution,
						),
						paths: this.tsconfig.compilerOptions?.paths ?? {},
					},
				});
				const modulesToProcess = this.moduleQueue
					.map((module) => this.getProcessableModule(module))
					.filter((module): module is ModuleInformation => !!module);

				const modulePathToGroupBysMap = new Map<string, string[]>();
				const groupByToExportsInformationMap = new Map<string, ExportsInformation>();

				for (const { path } of modulesToProcess) {
					smallTsProject.addSourceFileAtPath(path);
				}
				smallTsProject.resolveSourceFileDependencies();

				for (const { path, module } of modulesToProcess) {
					const {
						classesInformation,
						interfacesInformation,
						constantsInformation,
						functionsInformation,
					} = generateTypeInformation(
						path,
						smallTsProject,
						this.options.excludeProperties,
					);

					for (const classInformation of classesInformation) {
						this.addClassCodeDocDependency(classInformation, module);
					}
					for (const interfaceInformation of interfacesInformation) {
						this.addInterfaceCodeDocDependency(interfaceInformation, module);
					}
					for (const constantInformation of constantsInformation) {
						this.addConstantCodeDocDependency(constantInformation, module);
					}
					for (const functionInformation of functionsInformation) {
						this.addFunctionCodeDocDependency(functionInformation, module);
					}

					const constantsAndFunctionsInformation = functionsInformation.concat(
						...constantsInformation,
					);

					// If there are no constantsInformation and no functionsInformation in the current
					// module, we don't have to do anything more for the current module.
					if (!constantsAndFunctionsInformation.length) {
						continue;
					}

					/*
						Multiple constants and functions information from multiple source files
					    can be grouped into the same ArgTypes table via groupBy.

					    "groupBys" are aliases added via the @include-docs tags in the JSDoc,
					    e.g. "@include-docs Alias1, Alias2".
					    Information for all constants and functions annotated with "Alias1" will
					    appear in the same ArgTypes table, same for "Alias2".

					    For this to work, we need to add a CodeDocDependency with all exports
					    that contain a specific groupBy alias to all modules that also have an
					    export with the same groupBy alias.
					*/

					// For that, we first collect all aliases that occur in the current module.
					const groupBys = Array.from(
						new Set(constantsAndFunctionsInformation.flatMap((info) => info.groupBy)),
					);

					// We store all groupBy aliases of the current module in a map we can
					// access later when adding the CodeDocDependencies.
					modulePathToGroupBysMap.set(path, groupBys);

					for (const groupBy of groupBys) {
						// If an entry for the current groupBy alias already exists,
						// return the existing, otherwise create a new empty
						// ExportsInformation object.
						let currentExportsInformation = groupByToExportsInformationMap.get(
							groupBy,
						) || {
							constantsInformation: [],
							functionsInformation: [],
						};

						for (const constantInformation of constantsInformation) {
							if (constantInformation.groupBy.includes(groupBy)) {
								// Add the current constantInformation and avoid multiple entries with
								// the same name.
								currentExportsInformation = {
									...currentExportsInformation,
									constantsInformation:
										currentExportsInformation.constantsInformation
											.filter((ci) => ci.name !== ci.name)
											.concat(constantInformation),
								};
							}
						}

						for (const functionInformation of functionsInformation) {
							if (functionInformation.groupBy.includes(groupBy)) {
								// Add the current functionInformation and avoid multiple entries with
								// the same name.
								currentExportsInformation = {
									...currentExportsInformation,
									functionsInformation:
										currentExportsInformation.functionsInformation
											.filter((fi) => fi.name !== functionInformation.name)
											.concat(functionInformation),
								};
							}
						}

						// After adding all new constantsInformation and functionsInformation,
						// update the ExportsInformation map entry.
						groupByToExportsInformationMap.set(groupBy, currentExportsInformation);
					}
				}

				// Now, iterate over all modules a second time and add CodeDocDependencies
				// for the grouped exports.
				for (const { module, path } of modulesToProcess) {
					const groupBys = modulePathToGroupBysMap.get(path) || [];
					// Nothing to do if there are no groupBy aliases in the current module
					if (!groupBys.length) {
						continue;
					}

					for (const groupBy of groupBys) {
						const exportsInformation = groupByToExportsInformationMap.get(groupBy);
						if (!exportsInformation) {
							continue;
						}
						const groupedExportInformation: GroupedExportInformation = {
							name: groupBy,
							constantsInformation: exportsInformation.constantsInformation,
							functionsInformation: exportsInformation.functionsInformation,
						};
						this.addGroupedExportsCodeDocDependency(groupedExportInformation, module);
					}
				}

				this.moduleQueue = [];
			});
		});
	}

	// noinspection JSMethodCanBeStatic
	private addClassCodeDocDependency(ci: ClassInformation, module: Module): void {
		const uniqueId = getGlobalUniqueId(module.identifier(), ci.name);
		const codeDocDependency = new CodeDocDependency(
			ci.name,
			uniqueId,
			getClassArgCodeBlock(ci.name, uniqueId, ci.entitiesByCategory),
			getPrototypeClassIdCodeBlock(ci.name, uniqueId),
		);

		module.addDependency(codeDocDependency);
	}

	// noinspection JSMethodCanBeStatic
	private addInterfaceCodeDocDependency(
		interfaceInformation: InterfaceInformation,
		module: Module,
	): void {
		for (const alias of interfaceInformation.aliases) {
			const uniqueId = getGlobalUniqueId(module.identifier(), alias);
			const codeDocDependency = new CodeDocDependency(
				alias,
				uniqueId,
				getNonClassArgCodeBlock(alias, interfaceInformation.entitiesByCategory),
			);
			module.addDependency(codeDocDependency);
		}
	}

	// noinspection JSMethodCanBeStatic
	private addFunctionCodeDocDependency(
		functionInformation: FunctionInformation,
		module: Module,
	): void {
		const name = functionInformation.name;
		const uniqueId = getGlobalUniqueId(module.identifier(), name);
		const codeDocDependency = new CodeDocDependency(
			name,
			uniqueId,
			getNonClassArgCodeBlock(name, { functions: [functionInformation.entity] }),
		);
		module.addDependency(codeDocDependency);
	}

	// noinspection JSMethodCanBeStatic
	private addConstantCodeDocDependency(
		constantInformation: ConstantInformation,
		module: Module,
	): void {
		const name = constantInformation.name;
		const uniqueId = getGlobalUniqueId(module.identifier(), name);
		const codeDocDependency = new CodeDocDependency(
			name,
			uniqueId,
			getNonClassArgCodeBlock(name, { constants: [constantInformation.entity] }),
		);
		module.addDependency(codeDocDependency);
	}

	// noinspection JSMethodCanBeStatic
	private addGroupedExportsCodeDocDependency(
		groupedExportInformation: GroupedExportInformation,
		module: Module,
	): void {
		const uniqueId = getGlobalUniqueId(module.identifier(), groupedExportInformation.name);
		const codeDocDependency = new CodeDocDependency(
			groupedExportInformation.name,
			uniqueId,
			getNonClassArgCodeBlock(groupedExportInformation.name, {
				constants: groupedExportInformation.constantsInformation.map((c) => c.entity),
				functions: groupedExportInformation.functionsInformation.map((f) => f.entity),
			}),
		);
		module.addDependency(codeDocDependency);
	}

	private isModuleProcessable(module: Module): boolean {
		const filePath = module.nameForCondition();
		return !!filePath && filePath.endsWith('.ts') && this.isPathIncludedInTsConfig(filePath);
	}

	private isPathIncludedInTsConfig(pathToCheck: string): boolean {
		const res = micromatch([pathToCheck], this.includedPaths, {
			format: this.toUnixPath,
		});
		return res.length === 1;
	}

	private getProcessableModule(module: Module): ModuleInformation | null {
		const filePath = module.nameForCondition();
		// this should never occur since we only take modules that are processable
		if (!this.isModuleProcessable(module) || !filePath) {
			return null;
		}
		return {
			module,
			path: filePath,
		};
	}

	private getIncludedPathsFromTsconfig(
		tsconfigPath: string,
		tsconfig: TsConfigJsonResolved,
	): string[] {
		const tsConfigRootDir = path.join(process.cwd(), tsconfigPath, '..');

		const includedPaths = tsconfig.include || [];
		const excludedPaths = tsconfig.exclude || [];

		return [
			...this.transformToAbsolutePaths(tsConfigRootDir, includedPaths),
			...this.transformToAbsolutePaths(tsConfigRootDir, excludedPaths).map(this.negateGlob),
		].map(this.toUnixPath);
	}

	private transformToAbsolutePaths(base: string, paths: string[]): string[] {
		return paths.map((p) => {
			if (path.isAbsolute(p)) {
				return p;
			}
			return path.join(base, p);
		});
	}

	private negateGlob(glob: string): string {
		return `!${glob}`;
	}

	private toUnixPath(path: string): string {
		return path.replaceAll('\\', '/');
	}
}
