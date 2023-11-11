/* eslint-disable */
export default {
	displayName: 'storybook-webpack-angular-types-plugin',
	preset: '../../jest.preset.js',
	globals: {},
	transform: {
		'^.+\\.[tj]s$': [
			'ts-jest',
			{
				tsconfig: '<rootDir>/tsconfig.spec.json',
			},
		],
	},
	moduleFileExtensions: ['ts', 'js', 'html'],
	coverageDirectory: '../../coverage/packages/storybook-webpack-angular-types-plugin',
};
