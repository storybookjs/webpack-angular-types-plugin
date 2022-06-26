(window as any)[STORYBOOK_ANGULAR_ARG_TYPES] = {};

import {
    STORYBOOK_ANGULAR_ARG_TYPES,
    extractArgTypes,
} from "storybook-webpack-angular-types-plugin";

export const parameters = {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    docs: {
        inlineStories: true,
        extractArgTypes,
        extractComponentDescription: undefined,
    },
};
