const rootMain = require('../../../.storybook/main');
const WebpackAngularTypesPlugin =
	require('../../../dist/packages/storybook-webpack-angular-types-plugin/index').WebpackAngularTypesPlugin;

module.exports = {
	...rootMain,

	core: { ...rootMain.core, builder: 'webpack5' },

	stories: [
		...rootMain.stories,
		'../src/app/**/*.stories.mdx',
		'../src/app/**/*.stories.@(js|jsx|ts|tsx)',
	],
	addons: [...rootMain.addons],
	webpackFinal: async (config, { configType }) => {
		// apply any global webpack configs that might have been specified in .storybook/main.js
		if (rootMain.webpackFinal) {
			config = await rootMain.webpackFinal(config, { configType });
		}

		// add your own webpack tweaks if needed
		config.plugins.push(new WebpackAngularTypesPlugin());

		return config;
	},
};
