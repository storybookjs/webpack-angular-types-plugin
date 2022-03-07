const WebpackAngularTypesPlugin =
    require("../../../../dist/webpack-angular-types-plugin/plugin").WebpackAngularTypesPlugin;

module.exports = {
    stories: [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)",
    ],
    addons: [
        "@storybook/addon-links",
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
