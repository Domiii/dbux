const path = require('path');
const fs = require('fs');
const process = require('process');
const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

process.env.BABEL_DISABLE_CACHE = 1;


exports.makeAbsolutePaths = function makeAbsolutePaths(root, relativePaths) {
  return relativePaths.map(f => path.resolve(path.join(root, f)));
};

/**
 * Resolve dependencies:
 * 1. node_modules/
 * 2. relativePaths: A list of paths relative to `root` that are also used in this project
 */
exports.makeResolve = function makeResolve(root, relativePaths = []) {
  const absolutePaths = relativePaths.map(f => path.resolve(path.join(root, f)));
  absolutePaths.forEach(f => {
    if (!fs.existsSync(f)) {
      throw new Error('invalid dependency does not exist: ' + f);
    }
  });

  const moduleFolders = [
    path.join(root, '/node_modules'),
    ...absolutePaths
      .map(f => [path.join(f, 'src'), path.join(f, 'node_modules')])
      .flat()
      .map(f => path.resolve(f))
  ];

  // adding these aliases allows resolving required libraries without them being in `node_modules`
  const alias = fromEntries(relativePaths.map(target => [
    path.basename(target), 
    path.resolve(path.join(root, target))
  ]));

  return {
    symlinks: true,
    alias,
    modules: [
      // see: https://github.com/webpack/webpack/issues/8824#issuecomment-475995296
      ...moduleFolders
    ]
  };
};