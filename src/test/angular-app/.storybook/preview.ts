(window as any)[STORYBOOK_ANGULAR_ARG_TYPES] = {};

import { STORYBOOK_ANGULAR_ARG_TYPES } from "../../../constants";
import { extractArgTypes } from "../../../extract-args-types/extract-arg-types";

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
