const rootMain = require('../../../.storybook/main');
const WebpackAngularTypesPlugin =
	require('../../../dist/packages/storybook-webpack-angular-types-plugin/index').WebpackAngularTypesPlugin;

module.exports = {
	...rootMain,

	core: { builder: 'webpack5' },

	stories: ['../src/app/**/*.mdx', '../src/app/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: ['@storybook/addon-essentials'],
	webpackFinal: async (config, { configType }) => {
		// add your own webpack tweaks if needed
		config.plugins.push(
			new WebpackAngularTypesPlugin({
				tsconfigPath: './packages/angular-demo/.storybook/tsconfig.json',
			}),
		);

		return config;
	},
};
