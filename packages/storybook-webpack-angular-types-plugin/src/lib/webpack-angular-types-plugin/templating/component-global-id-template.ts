import { STORYBOOK_COMPONENT_ID } from '../../constants';
import { componentWithIdString } from '../utils';

export function getPrototypeComponentIDCodeBlock(className: string, id: number) {
	return `${className}.prototype["${STORYBOOK_COMPONENT_ID}"] = "${componentWithIdString(
		className,
		id,
	)}";`;
}
