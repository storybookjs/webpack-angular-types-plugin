import { Project } from "ts-morph";
import { Compiler, Dependency, Module } from "webpack";
import { generateTypeDocs } from "./extract-types";

const getComponentArgCodeBlock = (cmpName: string, types: object) => `
if (window.STORYBOOK_ANGULAR_ARG_TYPES !== undefined) {
  window.STORYBOOK_ANGULAR_ARG_TYPES.${cmpName} = ${JSON.stringify(types)};
}
`;

class CodeDocDependency extends Dependency {
    constructor(public codeDocInstructions: string) {
        super();
    }
    // eslint-disable-next-line
    updateHash(hash: any) {
        hash.update(this.codeDocInstructions);
    }
}

class MyDepTemplate {
    // eslint-disable-next-line
    apply(myDep: CodeDocDependency, source: any) {
        if (myDep.codeDocInstructions) {
            source.insert(Infinity, myDep.codeDocInstructions);
        }
    }
}

export class WebpackAngularTypesPlugin {
    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap("TestPlugin", (compilation) => {
            compilation.hooks.seal.tap("TestPlugin", () => {
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
                for (const [name, module] of modulesToProcess) {
                    const types = generateTypeDocs(name);
                    for (const componentTypeKey of Object.keys(types)) {
                        const componentTypeInfo = types[componentTypeKey];
                        module.addDependency(
                            new CodeDocDependency(
                                getComponentArgCodeBlock(
                                    componentTypeKey,
                                    componentTypeInfo
                                )
                            )
                        );
                    }
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
