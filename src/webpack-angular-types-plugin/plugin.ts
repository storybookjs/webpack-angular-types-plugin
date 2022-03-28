import { Project } from "ts-morph";
import { Compiler, Module } from "webpack";
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
        compiler.hooks.compilation.tap("TestPlugin", (compilation) => {
            compilation.dependencyTemplates.set(
                CodeDocDependency,
                new CodeDocDependencyTemplate()
            );
            compilation.hooks.seal.tap("TestPlugin", () => {
                // TODO the whole project is created each time the seal hook of the compilation is called
                //  this is potentially pretty costly since often times only a small subset of the files
                //  change on incremental reload. Probably better: remove/add changed/new source files
                //  incrementally
                const tsProject = new Project({
                    tsConfigFilePath: "./.storybook/tsconfig.json",
                });

                const modulesToProcess = this.collectModulesToProcess(
                    compilation.modules,
                    tsProject
                );
                for (const [name, module] of modulesToProcess) {
                    const classInformation: ClassInformation[] =
                        generateClassInformation(name, tsProject);
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
