import { STORYBOOK_COMPONENT_ID } from "../../constants";

export function getPrototypeUUIDCodeBlock(className: string, uuid: string) {
    return `${className}.prototype["${STORYBOOK_COMPONENT_ID}"] = "${uuid}"`;
}
