import { STORYBOOK_COMPONENT_UUID } from "../constants";

export function getPrototypeUUIDCodeBlock(className: string, uuid: string) {
    return `${className}.prototype["${STORYBOOK_COMPONENT_UUID}"] = "${uuid}"`;
}
