import { Project } from "ts-morph";
import { Compiler, Module } from "webpack";
import { DEFAULT_TS_CONFIG_PATH, PLUGIN_NAME } from "../constants";
import { ClassInformation } from "../types";
import { getGlobalUniqueIdForClass } from "./class-id-registry";
import {
    CodeDocDependency,
    CodeDocDependencyTemplate,
} from "./templating/code-doc-dependency";
import { getComponentArgCodeBlock } from "./templating/component-arg-block-code-template";
import { getPrototypeComponentIDCodeBlock } from "./templating/component-global-id-template";
import { generateClassInformation } from "./type-extraction/type-extraction";

export class WebpackAngularTypesPlugin {
    apply(compiler: Compiler) {
        const tsProject = new Project({
            tsConfigFilePath: DEFAULT_TS_CONFIG_PATH,
            skipLoadingLibFiles: true,
            skipFileDependencyResolution: true,
        });
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.dependencyTemplates.set(
                CodeDocDependency,
                new CodeDocDependencyTemplate()
            );
            compilation.hooks.seal.tap(PLUGIN_NAME, () => {
                const modulesToProcess = this.collectModulesToProcess(
                    compilation.modules,
                    tsProject
                );
                // TODO check if this approach is actually faster
                const smallTsProject = new Project({
                    tsConfigFilePath: DEFAULT_TS_CONFIG_PATH,
                    skipAddingFilesFromTsConfig: true,
                    skipFileDependencyResolution: true,
                });
                for (const moduleToProcess of modulesToProcess) {
                    smallTsProject.addSourceFileAtPath(moduleToProcess[0]);
                }
                smallTsProject.resolveSourceFileDependencies();

                for (const [name, module] of modulesToProcess) {
                    const classInformation: ClassInformation[] =
                        generateClassInformation(name, smallTsProject);
                    for (const ci of classInformation) {
                        this.addCodeDocDependencyToClass(ci, module);
                    }
                }
            });
        });
    }

    // noinspection JSMethodCanBeStatic
    private addCodeDocDependencyToClass(
        ci: ClassInformation,
        module: Module
    ): void {
        const moduleClassId = getGlobalUniqueIdForClass(module.id, ci.name);
        const codeDocDependency = new CodeDocDependency(
            ci.name,
            moduleClassId,
            getComponentArgCodeBlock(ci.name, moduleClassId, ci.properties),
            getPrototypeComponentIDCodeBlock(ci.name, moduleClassId)
        );
        module.addDependency(codeDocDependency);
    }

    // noinspection JSMethodCanBeStatic
    private collectModulesToProcess(
        modules: Set<Module>,
        tsProject: Project
    ): [string, Module][] {
        const modulesToProcess: [string, Module][] = [];
        for (const module of modules) {
            const filePath = module.nameForCondition();

            // Skip null values (e.g. raw files)
            if (!filePath) {
                continue;
            }

            // Only add modules that are part of the tsProject
            if (tsProject.getSourceFile(filePath) && filePath.endsWith(".ts")) {
                modulesToProcess.push([filePath, module]);
            }
        }

        return modulesToProcess;
    }
}
