import { StorybookConfig } from '@storybook/angular';

const WebpackAngularTypesPlugin =
	require('../../../dist/packages/storybook-webpack-angular-types-plugin/index').WebpackAngularTypesPlugin;

const config: StorybookConfig = {
	framework: {
		name: '@storybook/angular',
		options: {},
	},
	core: {
		builder: '@storybook/builder-webpack5',
	},
	stories: ['../src/app/**/*.mdx', '../src/app/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: ['@storybook/addon-docs'],
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

export default config;
