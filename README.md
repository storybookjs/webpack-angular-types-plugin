# Webpack angular types plugin

A webpack plugin that generates types information for the Storybook `<ArgTypes />`
during compile time of Storybook itself.

> **Heads up!** This package is in an experimental stage and not yet officially
> supported by Storybook until it got reviewed and approved by the core team.

## Goals

- **Being fast.** The additional type extraction should not be noticeable.
- **Zero-config.** The `<ArgTypes />` should render useful information out-of-the-box.
- **Configurable.** The plugin should be configurable in a way that you can adjust the content of `<ArgTypes />`.

## Installation

### Remove compodoc

If you are using compodoc for extracting types from your components, then you first have to remove it.

**.storybook/preview.js**

```javascript
// Remove these
import { setCompodocJson } from '@storybook/addon-docs/angular';
import docJson from '../documentation.json';
setCompodocJson(docJson);
```

**package.json**

```json
{
	// Before
	"scripts": {
		"docs:json": "compodoc -p ./tsconfig.json -e json -d .",
		"storybook": "yarn docs:json && start-storybook -p 6006",
		"build-storybook": "yarn docs:json && build-storybook"
	},
	// after
	"scripts": {
		"storybook": "start-storybook -p 6006",
		"build-storybook": "build-storybook"
	}
}
```

If you don't use compodoc for anything else, then you should remove the `documentation.json` in your root directory
as well as the compodoc dependency in your `package.json`.

### Install package

```shell
npm install storybook-webpack-angular-types-plugin --save-dev
```

### Configure storybook

The following steps are necessary because this plugin is not yet integrated as a Storybook addon.

**.storybook/main.ts**

```javascript
const WebpackAngularTypesPlugin =
	require('storybook-webpack-angular-types-plugin/index').WebpackAngularTypesPlugin;

module.exports = {
	// ...
	webpackFinal: (config) => {
		config.plugins.push(new WebpackAngularTypesPlugin());
		return config;
	},
};
```

**.storybook/preview.ts**

```typescript
import {
	extractArgTypes,
	STORYBOOK_ANGULAR_ARG_TYPES,
} from 'storybook-webpack-angular-types-plugin/extract-arg-types';

(window as any)[STORYBOOK_ANGULAR_ARG_TYPES] = {};

export const parameters = {
	docs: {
		inlineStories: true,
		extractArgTypes,
	},
};
```

## Features

Take a look at the `packages/anguar-demo` package to see the possibilities of this plugin.
A full documentation will be available at a later point in time.

You can start the demo app by running

```shell
npm run start-demo
```
