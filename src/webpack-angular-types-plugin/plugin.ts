import * as path from "path";
import { Project } from "ts-morph";
import { Compiler } from "webpack";

export const env = (prevEnv: any) => ({
    ...prevEnv,
    STORYBOOK_FOO: "FOO",
});

export class WebpackAngularTypesPlugin {
    tsProject = new Project({
        tsConfigFilePath: path.resolve(__dirname, "tsconfig.json"),
    });

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap("TestPlugin", (compilation) => {
            compilation.hooks.seal.tap("TestPlugin", () => {
                console.log("Does work");
                // const types = extractTypes(this.tsProject);
                // const modules: Module[] = compilation.modules;
                // for (let module of modules) {
                // }
            });
        });
    }
}
