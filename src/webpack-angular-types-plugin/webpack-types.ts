import { Dependency } from "webpack";

export class CodeDocDependency extends Dependency {
    constructor(public codeDocInstructions: string) {
        super();
    }
    // eslint-disable-next-line
    updateHash(hash: any) {
        hash.update(this.codeDocInstructions);
    }
}

export class CodeDocDependencyTemplate {
    // eslint-disable-next-line
    apply(myDep: CodeDocDependency, source: any) {
        if (myDep.codeDocInstructions) {
            source.insert(Infinity, myDep.codeDocInstructions);
        }
    }
}
