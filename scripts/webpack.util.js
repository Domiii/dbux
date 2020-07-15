const path = require('path');
const fs = require('fs');
const process = require('process');

// eslint-disable-next-line
const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12

process.env.BABEL_DISABLE_CACHE = 1;

// ###########################################################################
// makeAbsolutePaths
// ###########################################################################

function makeAbsolutePaths(root, relativePaths) {
  return relativePaths.map(f => path.resolve(path.join(root, f)));
}

// ###########################################################################
// package.json
// ###########################################################################

function readPackageJsonFile(fpath) {
  const content = fs.readFileSync(fpath);
  return JSON.parse(content);
}

function readPackageJson(folder) {
  const packageJsonPath = path.join(folder, 'package.json');
  return readPackageJsonFile(packageJsonPath);
}

function readPackageJsonName(folder) {
  const packageJson = readPackageJson(folder);
  return packageJson && packageJson.name;
}

function readPackageJsonDependencies(root, entryName, pattern) {
  const folder = path.join(root, entryName);
  const packageJson = readPackageJson(folder);
  let dependencies = packageJson && packageJson.dependencies;
  if (!dependencies) {
    return [];
  }

  dependencies = Object.keys(dependencies);
  return dependencies.filter(dep => pattern.test(dep));
}


/**
 * Build webpack `resolve` entry for dependencies from `package.json`.
 * WARNING: Assumes matching dependencies to be direct children of `root` path.
 */
function makeResolvePackageJson(root, entryName, dependencyPattern) {
  const deps = readPackageJsonDependencies(root, entryName, dependencyPattern);
  return makeResolve(root, deps);
}

// ###########################################################################
// makeResolve
// ###########################################################################

/**
 * Resolve dependencies:
 * 1. node_modules/
 * 2. relativePaths: A list of paths relative to `root` that are also used in this project
 */
function makeResolve(root, relativePaths = []) {
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

  // readPackageJsonName

  // adding these aliases allows resolving required libraries without them being in `node_modules`
  const alias = fromEntries(relativePaths.map(target => {
    // const folderName = path.basename(target);
    const folder = path.resolve(path.join(root, target));
    const packageName = readPackageJsonName(folder);
    return [
      packageName,
      folder
    ];
  }));

  return {
    symlinks: true,
    alias,
    modules: [
      // see: https://github.com/webpack/webpack/issues/8824#issuecomment-475995296
      ...moduleFolders
    ]
  };
}


// ###########################################################################
// 
// ###########################################################################


module.exports = {
  makeAbsolutePaths,
  makeResolve,

  readPackageJson,
  makeResolvePackageJson,
  getDependenciesPackageJson: readPackageJsonDependencies
};