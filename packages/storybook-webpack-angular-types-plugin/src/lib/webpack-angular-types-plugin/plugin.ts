import { getTsconfig } from 'get-tsconfig';
import * as micromatch from 'micromatch';
import * as path from 'path';
import * as process from 'process';
import { ModuleKind, ModuleResolutionKind, Project, ScriptTarget } from 'ts-morph';
import { Compiler, Module } from 'webpack';
import { DEFAULT_TS_CONFIG_PATH, PLUGIN_NAME } from '../constants';
import { ClassInformation, ModuleInformation, WebpackAngularTypesPluginOptions } from '../types';
import { getGlobalUniqueIdForClass } from './class-id-registry';
import { CodeDocDependency, CodeDocDependencyTemplate } from './templating/code-doc-dependency';
import { getComponentArgCodeBlock } from './templating/component-arg-block-code-template';
import { getPrototypeComponentIDCodeBlock } from './templating/component-global-id-template';
import { generateClassInformation } from './type-extraction/type-extraction';

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
					const classInformation: ClassInformation[] = generateClassInformation(
						path,
						smallTsProject,
						this.options.excludeProperties,
					);
					for (const ci of classInformation) {
						this.addCodeDocDependencyToClass(ci, module);
					}
				}
				this.moduleQueue = [];
			});
		});
	}

	// noinspection JSMethodCanBeStatic
	private addCodeDocDependencyToClass(ci: ClassInformation, module: Module): void {
		const moduleClassId = getGlobalUniqueIdForClass(module.identifier(), ci.name);
		const codeDocDependency = new CodeDocDependency(
			ci.name,
			moduleClassId,
			getComponentArgCodeBlock(ci.name, moduleClassId, ci.entitiesByCategory),
			getPrototypeComponentIDCodeBlock(ci.name, moduleClassId),
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
