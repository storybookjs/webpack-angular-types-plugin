const WebpackAngularTypesPlugin =
    require("../../../../dist/webpack-angular-types-plugin/plugin").WebpackAngularTypesPlugin;

const extractArgTypes =
    require("../../../../dist/extract-args-types/extract-arg-types").extractArgTypes;

module.exports = {
    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)",
    ],
    addons: [
        "@storybook/addon-links",
        {
            name: "@storybook/addon-docs",
            options: { extractArgTypes },
        },
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
    ],
    framework: "@storybook/angular",
    core: {
        builder: "webpack5",
    },
    webpackFinal: async (config) => {
        config.plugins.push(new WebpackAngularTypesPlugin());
        return config;
    },
};
