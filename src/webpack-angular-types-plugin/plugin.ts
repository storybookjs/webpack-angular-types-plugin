import { Project } from "ts-morph";
import { Compiler, Module } from "webpack";
import { DEFAULT_TS_CONFIG_PATH, PLUGIN_NAME } from "../constants";
import { ClassInformation, ModuleInformation } from "../types";
import { getGlobalUniqueIdForClass } from "./class-id-registry";
import {
    CodeDocDependency,
    CodeDocDependencyTemplate,
} from "./templating/code-doc-dependency";
import { getComponentArgCodeBlock } from "./templating/component-arg-block-code-template";
import { getPrototypeComponentIDCodeBlock } from "./templating/component-global-id-template";
import { generateClassInformation } from "./type-extraction/type-extraction";

export class WebpackAngularTypesPlugin {
    // A queue for modules, that should be processed by the plugin in the next seal-hook
    private moduleQueue: Module[] = [];

    // A dummy tsProject that is used to gather the glob-paths from the "include"
    // field of the tsconfig file (therefore all dependency resolution etc is skipped)
    // TODO maybe this can be replaced with a super-fast glob implementation
    private tsProject = new Project({
        tsConfigFilePath: DEFAULT_TS_CONFIG_PATH,
        skipLoadingLibFiles: true,
        skipFileDependencyResolution: true,
    });

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.dependencyTemplates.set(
                CodeDocDependency,
                new CodeDocDependencyTemplate()
            );
            compilation.hooks.buildModule.tap(PLUGIN_NAME, (module) => {
                this.moduleQueue.push(module);
            });
            compilation.hooks.seal.tap(PLUGIN_NAME, () => {
                const smallTsProject = new Project({
                    tsConfigFilePath: DEFAULT_TS_CONFIG_PATH,
                    skipLoadingLibFiles: true,
                    skipAddingFilesFromTsConfig: true,
                    skipFileDependencyResolution: true,
                });

                const modulesToProcess = this.moduleQueue
                    .map((module) => this.getModuleInfoIfProcessable(module))
                    .filter((module): module is ModuleInformation => !!module);
                for (const { path } of modulesToProcess) {
                    smallTsProject.addSourceFileAtPath(path);
                }
                smallTsProject.resolveSourceFileDependencies();

                for (const { path, module } of modulesToProcess) {
                    const classInformation: ClassInformation[] =
                        generateClassInformation(path, smallTsProject);
                    for (const ci of classInformation) {
                        this.addCodeDocDependencyToClass(ci, module);
                    }
                }
                this.moduleQueue = [];
            });
        });
    }

    // noinspection JSMethodCanBeStatic
    private addCodeDocDependencyToClass(
        ci: ClassInformation,
        module: Module
    ): void {
        const moduleClassId = getGlobalUniqueIdForClass(
            module.identifier(),
            ci.name
        );
        const codeDocDependency = new CodeDocDependency(
            ci.name,
            moduleClassId,
            getComponentArgCodeBlock(ci.name, moduleClassId, ci.properties),
            getPrototypeComponentIDCodeBlock(ci.name, moduleClassId)
        );
        module.addDependency(codeDocDependency);
    }

    private getModuleInfoIfProcessable(
        module: Module
    ): ModuleInformation | null {
        const filePath = module.nameForCondition();

        // Skip null values (e.g. raw files)
        if (!filePath) {
            return null;
        }

        // Only add modules that are part of the tsProject
        if (
            !this.tsProject.getSourceFile(filePath) ||
            !filePath.endsWith(".ts")
        ) {
            return null;
        }

        return {
            module,
            path: filePath,
        };
    }
}
