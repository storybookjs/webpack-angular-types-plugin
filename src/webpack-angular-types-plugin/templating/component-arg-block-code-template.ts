import { STORYBOOK_ANGULAR_ARG_TYPES } from "../../constants";

export function getComponentArgCodeBlock(uuid: string, types: object) {
    return `
        if (window["${STORYBOOK_ANGULAR_ARG_TYPES}"] !== undefined) {
            window["${STORYBOOK_ANGULAR_ARG_TYPES}"]["${uuid}"] = ${JSON.stringify(
        types
    )};
        }
`;
}
