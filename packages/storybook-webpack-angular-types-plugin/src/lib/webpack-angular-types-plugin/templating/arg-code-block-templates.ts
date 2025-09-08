import { EntitiesByCategory } from '../../types';
import { STORYBOOK_ANGULAR_ARG_TYPES } from '../../constants';
import { classWithIdString } from '../utils';

const windowVariableInitializer = `if (!window["${STORYBOOK_ANGULAR_ARG_TYPES}"]) {
	window["${STORYBOOK_ANGULAR_ARG_TYPES}"] = {};
}`;

export function getClassArgCodeBlock(
	className: string,
	id: number,
	types: Partial<EntitiesByCategory>,
) {
	return `${windowVariableInitializer}
window["${STORYBOOK_ANGULAR_ARG_TYPES}"]["${classWithIdString(
		className,
		id,
	)}"] = ${JSON.stringify(types)};`;
}

export function getNonClassArgCodeBlock(name: string, types: Partial<EntitiesByCategory>) {
	return `${windowVariableInitializer}
window["${STORYBOOK_ANGULAR_ARG_TYPES}"]["${name}"] = ${JSON.stringify(types)};`;
}
