const path = require('path');
const moduleAlias = require('module-alias');

const dist = path.resolve(__dirname, '..', 'dist');


//   webpack: '../../dist/webpack/lib/index.js',
//   'webpack-cli': '../../dist/webpack-cli/packages/webpack-cli/lib/index.js'

moduleAlias.addAlias('webpack', path.resolve(dist, 'webpack/lib/index.js'));
moduleAlias.addAlias('webpack-cli', path.resolve(dist, 'webpack-cli/packages/webpack-cli/lib/index.js'));


// require('webpack');
// require('webpack-cli');