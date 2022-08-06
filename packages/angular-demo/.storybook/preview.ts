import {
    extractArgTypes,
    STORYBOOK_ANGULAR_ARG_TYPES,
} from "storybook-webpack-angular-types-plugin/extract-arg-types";

(window as any)[STORYBOOK_ANGULAR_ARG_TYPES] = {};

export const parameters = {
    docs: {
        inlineStories: true,
        extractArgTypes,
        extractComponentDescription: undefined,
    },
};
