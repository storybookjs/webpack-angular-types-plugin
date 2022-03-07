import { Project, SourceFile } from "ts-morph";
import { getProperties } from "./get-properties";

const getSourceFiles = (project: Project) => {
    const demoFiles = project.getSourceFiles(
        "node_modules/@storybook/angular/dist/ts3.9/demo/**/*.ts"
    );
    const projectFiles = project
        .getSourceFiles()
        .filter((sourceFile) => sourceFile.getClasses().length > 0);
    return projectFiles.concat(demoFiles);
};

const getAngularRelevantClasses = (sourceFiles: SourceFile[]) =>
    sourceFiles
        .map((sourceFile) =>
            sourceFile
                .getClasses()
                .filter(
                    (classDeclaration) =>
                        !!(
                            classDeclaration.getDecorator("Component") ||
                            classDeclaration.getDecorator("Directive")
                        )
                )
        )
        .reduce((acc, val) => acc.concat(val), []);

export function generateTypDocs(filepath: string) {
    const project = new Project({
        tsConfigFilePath: "../angular-app/.storybook/tsconfig.json",
    });
    project.addSourceFileAtPath(filepath);
    const clasDecls = getAngularRelevantClasses(project.getSourceFiles()).map(
        (classDecl) => {
            return {
                name: classDecl.getName(),
                ...getProperties(classDecl),
            };
        }
    );
    return Object.fromEntries(
        new Map(
            clasDecls.map((type) => {
                const { name, ...rest } = type;
                return [name, rest];
            })
        )
    );
}

export const extractTypes = (project: Project): DirectiveTypeExtraction => {
    const sourceFiles = getSourceFiles(project);

    const classesWithProps = getAngularRelevantClasses(sourceFiles).map(
        (classDeclaration) => ({
            name: classDeclaration.getName(),
            ...getProperties(classDeclaration),
        })
    );

    return Object.fromEntries(
        new Map(
            classesWithProps.map((type) => {
                const { name, ...rest } = type;
                return [name, rest];
            })
        )
    );
};

export interface DirectiveTypeExtraction {
    [key: string]: {
        inputs: any[];
        outputs: any[];
        propertiesWithoutDecorators: any[];
    };
}
