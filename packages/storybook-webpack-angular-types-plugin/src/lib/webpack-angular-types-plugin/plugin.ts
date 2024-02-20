import { getTsconfig } from 'get-tsconfig';
import * as micromatch from 'micromatch';
import * as path from 'path';
import * as process from 'process';
import { ModuleKind, ModuleResolutionKind, Project, ScriptTarget } from 'ts-morph';
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

export class WebpackAngularTypesPlugin {
	// A queue for modules, that should be processed by the plugin in the next seal-hook
	private moduleQueue: Module[] = [];

	private readonly tsconfigPaths: string[] = this.getTsconfigPaths();

	constructor(private options: WebpackAngularTypesPluginOptions = {}) {}
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
					// TODO this should be taken from the specified storybook tsconfig in the future
					compilerOptions: {
						module: ModuleKind.ES2020,
						target: ScriptTarget.ESNext,
						moduleResolution: ModuleResolutionKind.NodeJs,
					},
				});
				const modulesToProcess = this.moduleQueue
					.map((module) => this.getProcessableModule(module))
					.filter((module): module is ModuleInformation => !!module);

				for (const { path } of modulesToProcess) {
					smallTsProject.addSourceFileAtPath(path);
				}
				smallTsProject.resolveSourceFileDependencies();

				for (const { path, module } of modulesToProcess) {
					const {
						classesInformation,
						interfacesInformation,
						functionsInformation,
						constantsInformation,
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

					const groupedExportsInformation = this.groupExportInformation(
						functionsInformation,
						constantsInformation,
					);

					for (const groupedExportInformation of groupedExportsInformation) {
						this.addGroupedExportsCodeDocDependency(groupedExportInformation, module);
					}
				}
				this.moduleQueue = [];
			});
		});
	}

	/**
	 * Functions and constants can be annotated with "@group-docs" to collect them into a
	 * single ArgsTable. Returns information grouped by the "groupBy" property.
	 *
	 * @param functionsInformation list of all functions
	 * @param constantsInformation list of all constants
	 */
	private groupExportInformation(
		functionsInformation: FunctionInformation[],
		constantsInformation: ConstantInformation[],
	): GroupedExportInformation[] {
		const exportsInformationMap = new Map<string, ExportsInformation>();

		for (const functionInformation of functionsInformation) {
			const name = functionInformation.name;

			exportsInformationMap.set(name, {
				functionsInformation: [functionInformation],
				constantsInformation: [],
			});

			const groupBys = functionInformation.groupBy;

			for (const groupBy of groupBys) {
				if (groupBy) {
					const groupByEntry = exportsInformationMap.get(groupBy);
					if (groupByEntry) {
						if (groupByEntry.functionsInformation.length) {
							groupByEntry.functionsInformation.push(functionInformation);
						} else {
							groupByEntry.functionsInformation = [functionInformation];
						}
					} else {
						exportsInformationMap.set(groupBy, {
							functionsInformation: [functionInformation],
							constantsInformation: [],
						});
					}
				}
			}
		}

		for (const constantInformation of constantsInformation) {
			const name = constantInformation.name;
			const groupBys = constantInformation.groupBy;

			exportsInformationMap.set(name, {
				functionsInformation: [],
				constantsInformation: [constantInformation],
			});

			for (const groupBy of groupBys) {
				if (groupBy) {
					const groupByEntry = exportsInformationMap.get(groupBy);
					if (groupByEntry) {
						if (groupByEntry.constantsInformation.length) {
							groupByEntry.constantsInformation.push(constantInformation);
						} else {
							groupByEntry.constantsInformation = [constantInformation];
						}
					} else {
						exportsInformationMap.set(groupBy, {
							functionsInformation: [],
							constantsInformation: [constantInformation],
						});
					}
				}
			}
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
		const uniqueId = getGlobalUniqueId(module.identifier(), interfaceInformation.name);
		const codeDocDependency = new CodeDocDependency(
			interfaceInformation.name,
			uniqueId,
			getNonClassArgCodeBlock(
				interfaceInformation.name,
				interfaceInformation.entitiesByCategory,
			),
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
				functions: groupedExportInformation.functionsInformation.map((f) => f.entity),
				constants: groupedExportInformation.constantsInformation.map((c) => c.entity),
			}),
		);
		module.addDependency(codeDocDependency);
	}

	private isModuleProcessable(module: Module): boolean {
		const filePath = module.nameForCondition();
		return !!filePath && filePath.endsWith('.ts') && this.isPathIncludedInTsConfig(filePath);
	}

	private isPathIncludedInTsConfig(pathToCheck: string): boolean {
		const res = micromatch([pathToCheck], this.tsconfigPaths, {
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

	private getTsconfigPaths(): string[] {
		const tsconfigPath = this.options.tsconfigPath ?? DEFAULT_TS_CONFIG_PATH;
		const tsconfigResult = getTsconfig(tsconfigPath);
		//
		const tsConfigRootDir = path.join(process.cwd(), tsconfigPath, '..');
		const includedPaths = tsconfigResult?.config.include || [];
		const excludedPaths = tsconfigResult?.config.exclude || [];
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
