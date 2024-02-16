import { STORYBOOK_ANGULAR_ARG_TYPES } from '../../constants';
import { classWithIdString } from '../utils';

export function getClassArgCodeBlock(className: string, id: number, types: object) {
	return `if (window["${STORYBOOK_ANGULAR_ARG_TYPES}"] !== undefined) {
    window["${STORYBOOK_ANGULAR_ARG_TYPES}"]["${classWithIdString(
		className,
		id,
	)}"] = ${JSON.stringify(types)};
}`;
}

export function getInterfaceArgCodeBlock(interfaceName: string, types: object) {
	return `if (window["${STORYBOOK_ANGULAR_ARG_TYPES}"] !== undefined) {
    window["${STORYBOOK_ANGULAR_ARG_TYPES}"]["${interfaceName}"] = ${JSON.stringify(types)};
}`;
}
