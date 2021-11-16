const path = require('path');
const moduleAlias = require('module-alias');

// // const root = path.resolve(__dirname, '..', 'dist');
const root = path.resolve(__dirname, '..');


// //   webpack: '../../dist/webpack/lib/index.js',
// //   'webpack-cli': '../../dist/webpack-cli/packages/webpack-cli/lib/index.js'
// // moduleAlias.addAlias('webpack', path.resolve(root, 'webpack/lib/index.js'));

moduleAlias.addAlias('webpack', path.resolve(root, 'lib/index.js'));
moduleAlias.addAlias('webpack-cli', path.resolve(root, 'webpack-cli/packages/webpack-cli/lib/index.js'));

// require('webpack');
// require('webpack-cli');