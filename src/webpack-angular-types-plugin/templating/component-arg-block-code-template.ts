import { STORYBOOK_ANGULAR_ARG_TYPES } from "../../constants";
import { componentWithIdString } from "../utils";

export function getComponentArgCodeBlock(
    className: string,
    id: number,
    types: object
) {
    return `
        if (window["${STORYBOOK_ANGULAR_ARG_TYPES}"] !== undefined) {
            window["${STORYBOOK_ANGULAR_ARG_TYPES}"]["${componentWithIdString(
        className,
        id
    )}"] = ${JSON.stringify(types)};
        }
`;
}
