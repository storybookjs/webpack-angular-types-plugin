// This script is needed as long as nrwl/js:tsc builder is bugged, copying peerDependencies of used packages into
// its own package.json generated in the dist folder
const fs = require('fs');

const libPackageJson = JSON.parse(fs.readFileSync('packages/storybook-webpack-angular-types-plugin/package.json').toString());
const distPackageJson = JSON.parse(fs.readFileSync('dist/packages/storybook-webpack-angular-types-plugin/package.json').toString())

distPackageJson['dependencies'] = libPackageJson['dependencies'];
distPackageJson['peerDependencies'] = libPackageJson['peerDependencies'];

fs.writeFileSync('dist/packages/storybook-webpack-angular-types-plugin/package.json', JSON.stringify(distPackageJson, null, 2));

