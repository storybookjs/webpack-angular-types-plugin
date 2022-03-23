import { Dependency } from "webpack";

export class CodeDocDependency extends Dependency {
    constructor(
        public codeDocInstructions: string,
        public uuidCodeBlock: string
    ) {
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
        // TODO at the moment, on each reload, more and more code blocks are appended
        //      to each source. Should there be some way to replace them so that the
        //      window object is not cluttered with more and more unused types?
        /*const uuidCBLength = myDep.uuidCodeBlock.length;
        const regex = new RegExp(`$.+\\.prototype\\["${STORYBOOK_COMPONENT_ID}"]`, 'm');
        const sourceString = source.original() as string;
        const previousCodeBlockMatch = sourceString.match(regex);
        const insertionStartIndex = previousCodeBlockMatch && previousCodeBlockMatch.index ? previousCodeBlockMatch.index : Infinity;*/
        source.insert(Infinity, myDep.uuidCodeBlock);
        source.insert(Infinity, myDep.codeDocInstructions);
    }
}
