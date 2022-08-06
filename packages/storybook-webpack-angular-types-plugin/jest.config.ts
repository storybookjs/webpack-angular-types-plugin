/* eslint-disable */
export default {
    displayName: "storybook-webpack-angular-types-plugin",
    preset: "../../jest.preset.js",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/tsconfig.spec.json",
        },
    },
    transform: {
        "^.+\\.[tj]s$": "ts-jest",
    },
    moduleFileExtensions: ["ts", "js", "html"],
    coverageDirectory:
        "../../coverage/packages/storybook-webpack-angular-types-plugin",
};
