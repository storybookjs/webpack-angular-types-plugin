import { Project } from "ts-morph";
import { Compiler, Module } from "webpack";
import { getComponentArgCodeBlock } from "./component-arg-block-code-template";
import { generateClassInformation } from "./type-extraction";
import { ClassInformation } from "../types";
import {
    CodeDocDependency,
    CodeDocDependencyTemplate,
} from "./code-doc-dependency";

export class WebpackAngularTypesPlugin {
    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap("TestPlugin", (compilation) => {
            compilation.hooks.seal.tap("TestPlugin", () => {
                // TODO the whole project is created each time the seal hook of the compilation is called
                //  this is potentially pretty costly since often times only a small subset of the files
                //  change on incremental reload. Probably better: remove/add changed/new source files
                //  incrementally
                const tsProject = new Project({
                    tsConfigFilePath: "./.storybook/tsconfig.json",
                });
                compilation.dependencyTemplates.set(
                    CodeDocDependency,
                    new CodeDocDependencyTemplate()
                );

                const modulesToProcess = this.collectModulesToProcess(
                    compilation.modules,
                    tsProject
                );
                for (const [name, module] of modulesToProcess) {
                    const classInformation: ClassInformation[] =
                        generateClassInformation(name, tsProject);
                    for (const ci of classInformation) {
                        module.addDependency(
                            new CodeDocDependency(
                                getComponentArgCodeBlock(
                                    ci.uuid,
                                    ci.properties
                                ),
                                getPrototypeUUIDCodeBlock(ci.name, ci.uuid)
                            )
                        );
                    }
                }
            });
        });
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
