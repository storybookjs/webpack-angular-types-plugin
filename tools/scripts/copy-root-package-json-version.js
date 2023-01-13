// This script is needed to copy the version number of the root package json to the dist folder
const fs = require('fs');

const rootPackageJson = JSON.parse(fs.readFileSync('package.json').toString())
const distPackageJson = JSON.parse(fs.readFileSync('dist/packages/storybook-webpack-angular-types-plugin/package.json').toString());

distPackageJson['version'] = rootPackageJson['version'];

fs.writeFileSync('dist/packages/storybook-webpack-angular-types-plugin/package.json', JSON.stringify(distPackageJson, null, 2));


