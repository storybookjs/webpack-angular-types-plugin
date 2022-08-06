import { Dependency } from "webpack";

const codeBlockStartCommentPrefix =
    "//<webpack-angular-types-plugin-data-start>-";
const codeBlockEndCommentPrefix = "//<webpack-angular-types-plugin-data-end>-";

export class CodeDocDependency extends Dependency {
    constructor(
        public className: string,
        public classId: number,
        public codeDocInstructions: string,
        public uuidCodeBlock: string
    ) {
        super();
    }

    // eslint-disable-next-line
    override updateHash(hash: any) {
        // update the hash based on the most recent content, otherwise the dependency-template will
        // not be evaluated again
        hash.update(
            `${this.className}:${this.classId}:${this.codeDocInstructions}:${this.uuidCodeBlock}`
        );
    }
}

export class CodeDocDependencyTemplate {
    // eslint-disable-next-line
    apply(myDep: CodeDocDependency, source: any) {
        const commentStartStr = CodeDocDependencyTemplate.constructCommentStart(
            myDep.className
        );
        const commentEndStr = CodeDocDependencyTemplate.constructCommentEnd(
            myDep.className
        );
        const insertion = CodeDocDependencyTemplate.getInsertion(
            commentStartStr,
            commentEndStr,
            myDep
        );
        source.insert(Infinity, insertion);
    }

    private static getInsertion(
        startComment: string,
        endComment: string,
        dep: CodeDocDependency
    ): string {
        return (
            startComment +
            dep.uuidCodeBlock +
            "\n" +
            dep.codeDocInstructions +
            "\n" +
            endComment
        );
    }

    private static constructCommentStart(className: string): string {
        return `${codeBlockStartCommentPrefix}${className}\n`;
    }

    private static constructCommentEnd(className: string): string {
        return `${codeBlockEndCommentPrefix}${className}\n`;
    }
}
