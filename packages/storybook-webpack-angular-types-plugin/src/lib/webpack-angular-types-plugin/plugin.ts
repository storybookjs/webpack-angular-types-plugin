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
	FunctionInformation,
	GroupedExportInformation,
	InterfaceInformation,
	ModuleInformation,
	WebpackAngularTypesPluginOptions,
} from '../types';
import { getGlobalUniqueId } from './class-id-registry';
import { groupExportInformation } from './grouping/group-export-information';
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

				const collectedFunctionsInformation: FunctionInformation[] = [];
				const collectedConstantsInformation: ConstantInformation[] = [];
				const modulesWithFunctionsOrConstants: Module[] = [];

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
					if (functionsInformation.length || constantsInformation.length) {
						modulesWithFunctionsOrConstants.push(module);
					}
					collectedFunctionsInformation.push(...functionsInformation);
					collectedConstantsInformation.push(...constantsInformation);
				}

				for (const moduleWithFunctionsOrConstants of modulesWithFunctionsOrConstants) {
					const groupedExportsInformation = groupExportInformation(
						collectedFunctionsInformation,
						collectedConstantsInformation,
					);

					for (const groupedExportInformation of groupedExportsInformation) {
						this.addGroupedExportsCodeDocDependency(
							groupedExportInformation,
							moduleWithFunctionsOrConstants,
						);
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
