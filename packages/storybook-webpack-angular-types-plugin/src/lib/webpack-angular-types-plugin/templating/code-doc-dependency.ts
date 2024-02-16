import { Dependency } from 'webpack';

const codeBlockStartCommentPrefix = '//<webpack-angular-types-plugin-data-start>-';
const codeBlockEndCommentPrefix = '//<webpack-angular-types-plugin-data-end>-';

export class CodeDocDependency extends Dependency {
	constructor(
		public name: string,
		public uniqueId: number,
		public codeDocInstructions: string,
		public uuidCodeBlock?: string,
	) {
		super();
	}

	// eslint-disable-next-line
	override updateHash(hash: any) {
		// update the hash based on the most recent content, otherwise the dependency-template will
		// not be evaluated again
		hash.update(
			`${this.name}:${this.uniqueId}:${this.codeDocInstructions}:${this.uuidCodeBlock}`,
		);
	}
}

export class CodeDocDependencyTemplate {
	// eslint-disable-next-line
	apply(myDep: CodeDocDependency, source: any) {
		const commentStartStr = CodeDocDependencyTemplate.constructCommentStart(myDep.name);
		const commentEndStr = CodeDocDependencyTemplate.constructCommentEnd(myDep.name);
		const insertion = CodeDocDependencyTemplate.getInsertion(
			commentStartStr,
			commentEndStr,
			myDep,
		);
		source.insert(Infinity, insertion);
	}

	private static getInsertion(
		startComment: string,
		endComment: string,
		dep: CodeDocDependency,
	): string {
		let result = startComment;
		if (dep.uuidCodeBlock) {
			result = result.concat(`${dep.uuidCodeBlock}\n`);
		}
		result = result.concat(`${dep.codeDocInstructions}\n`);
		result = result.concat(endComment);

		return result;
	}

	private static constructCommentStart(name: string): string {
		return `${codeBlockStartCommentPrefix}${name}\n`;
	}

	private static constructCommentEnd(name: string): string {
		return `${codeBlockEndCommentPrefix}${name}\n`;
	}
}
