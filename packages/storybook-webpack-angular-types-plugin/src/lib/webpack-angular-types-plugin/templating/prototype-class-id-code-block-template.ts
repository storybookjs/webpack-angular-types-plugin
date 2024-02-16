import { STORYBOOK_COMPONENT_ID } from '../../constants';
import { classWithIdString } from '../utils';

export function getPrototypeClassIdCodeBlock(className: string, id: number) {
	return `${className}.prototype["${STORYBOOK_COMPONENT_ID}"] = "${classWithIdString(
		className,
		id,
	)}";`;
}
