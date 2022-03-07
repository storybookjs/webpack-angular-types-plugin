import { Project } from "ts-morph";
import { Compiler, Dependency, Module } from "webpack";
import { generateTypDocs } from "./extract-types";

const getComponentArgCodeBlock = (cmpName: string, types: object) => `
if (window.STORYBOOK_ANGULAR_ARG_TYPES !== undefined) {
  window.STORYBOOK_ANGULAR_ARG_TYPES.${cmpName} = ${JSON.stringify(types)};
}
`;

class CodeDocDependency extends Dependency {
    constructor(public codeDocInstructions: string) {
        super();
    }

    updateHash(hash: any) {
        hash.update(this.codeDocInstructions);
    }
}

class MyDepTemplate {
    apply(myDep: CodeDocDependency, source: any) {
        if (myDep.codeDocInstructions) {
            source.insert(Infinity, myDep.codeDocInstructions);
            console.log(source);
        }
    }
}

export class WebpackAngularTypesPlugin {
    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap("TestPlugin", (compilation) => {
            compilation.hooks.seal.tap("TestPlugin", () => {
                console.log(
                    "------------ 123123 123123123123 --------------------"
                );
                const tsProject = new Project({
                    // todo offer option or use proper default path
                    tsConfigFilePath: "./.storybook/tsconfig.json",
                });

                compilation.dependencyTemplates.set(
                    CodeDocDependency,
                    new MyDepTemplate()
                );

                const modulesToProcess = this.collectModulesToProcess(
                    compilation.modules,
                    tsProject
                );

                // const types = extractTypes(tsProject);
                for (const [name, module] of modulesToProcess) {
                    const types = generateTypDocs(name);
                    const firstTypeKey = Object.keys(types)[0];
                    const firstComponentTypes = types[firstTypeKey];
                    module.addDependency(
                        new CodeDocDependency(
                            getComponentArgCodeBlock(
                                firstTypeKey,
                                firstComponentTypes
                            )
                        )
                    );
                }
            });
        });
    }

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
