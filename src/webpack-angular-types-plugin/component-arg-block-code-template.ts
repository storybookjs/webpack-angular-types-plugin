import { STORYBOOK_ANGULAR_ARG_TYPES } from "../constants";

export function getComponentArgCodeBlock(cmpName: string, types: object) {
    return `
        if (window[${STORYBOOK_ANGULAR_ARG_TYPES}] !== undefined) {
            window[${STORYBOOK_ANGULAR_ARG_TYPES}][${cmpName}] = ${JSON.stringify(
        types
    )};
        }
`;
}
