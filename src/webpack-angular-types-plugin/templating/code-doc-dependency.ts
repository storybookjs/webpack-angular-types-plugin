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

    // TODO is this hash needed? Initially it did not work without it, but at
    //      the moment, it seems to work fine
    // eslint-disable-next-line
    /*updateHash(hash: any) {
        hash.update(this.className);
    }*/
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
