const WebpackAngularTypesPlugin =
    require("storybook-webpack-angular-types-plugin").WebpackAngularTypesPlugin;

module.exports = {
    stories: [
        "../storybook-webpack-angular-types-plugin/**/*.stories.mdx",
        "../storybook-webpack-angular-types-plugin/**/*.stories.@(js|jsx|ts|tsx)",
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
