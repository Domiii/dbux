const path = require('path');
const fs = require('fs');
const process = require('process');

// eslint-disable-next-line
const fromEntries = require('object.fromentries');    // NOTE: Object.fromEntries was only added in Node v12
const merge = require('lodash/merge');

// ###########################################################################
// misc
// ###########################################################################

function makeAbsolutePaths(root, relativePaths) {
  return relativePaths.map(f => path.resolve(path.join(root, f)));
}

function readJsonFile(fpath) {
  const content = fs.readFileSync(fpath);
  if (!content) {
    return null;
  }
  return JSON.parse(content);
}

function writeJsonFile(fpath, obj) {
  const s = JSON.stringify(obj, null, 2);
  fs.writeFileSync(fpath, s);
}

// ###########################################################################
// reading package.json
// ###########################################################################

function readPackageJson(folder) {
  const packageJsonPath = path.join(folder, 'package.json');
  return readJsonFile(packageJsonPath);
}

function readPackageJsonVersion(folder) {
  const pkg = readPackageJson(folder);
  return pkg.version;
}

/**
 * NOTE: only used for development
 */
function readLernaJson() {
  const lernaJsonPath = path.join(__dirname, '../..', 'lerna.json');
  return readJsonFile(lernaJsonPath);
}

function readPackageJsonName(folder) {
  const packageJson = readPackageJson(folder);
  return packageJson && packageJson.name;
}

function readPackageJsonDependencies(folder, pattern) {
  // const folder = path.join(root, entryName);
  const packageJson = readPackageJson(folder);
  let dependencies = packageJson && packageJson.dependencies;
  if (!dependencies) {
    return [];
  }

  dependencies = Object.keys(dependencies);
  return dependencies.filter(dep => pattern.test(dep));
}


/** ###########################################################################
 * write package.json
 *  #########################################################################*/


function writePackageJson(folder, pkg) {
  const packageJsonPath = path.join(folder, 'package.json');
  return writeJsonFile(packageJsonPath, pkg);
}

async function writeMergePackageJson(folder, obj) {
  const pkg = readPackageJson(folder);
  merge(pkg, obj);
  writePackageJson(folder, pkg);
}



// ###########################################################################
// makeResolve
// ###########################################################################



/**
 * Build webpack `resolve` entry for dependencies from `package.json`.
 * WARNING: Assumes matching dependencies to be direct children of `root` path.
 */
function makeResolvePackageJson(root, entryName, dependencyPattern) {
  const deps = readPackageJsonDependencies(root, entryName, dependencyPattern);
  return makeResolve(root, deps);
}

/**
 * Resolve dependencies:
 * 1. node_modules/
 * 2. relativePaths: A list of paths relative to `root` that are also used in this project
 */
function makeResolve(root, relativePaths = []) {
  const absolutePaths = relativePaths.map(f => path.resolve(path.join(root, f)));
  absolutePaths.forEach(f => {
    if (!fs.existsSync(f)) {
      throw new Error(`invalid dependency does not exist: ${f} (root=${root})`);
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
// getDbuxVersion
// ###########################################################################

function getDbuxVersion(mode) {
  const lerna = readLernaJson();
  if (!lerna.version) {
    throw new Error('lerna.json does not have a version.');
  }

  let { version } = lerna;
  // const originalVersion = version;
  // if (mode === 'production') {
  //   // NOTE: we used to not be able to run with the current "dev" build version since 
  //   //    we depended on a prod version to be available on the `npm` registry
  //   //    -> So we had to downgrade
  //   const match = version.match(/(\d+)\.(\d+)\.(\d+)(-dev\.\d+)?/);
  //   if (!match) {
  //     throw new Error(`Could not parse lerna version: ${version}`);
  //   }
  //   let [_, maj, min, pat, release] = match;
  //   [maj, min, pat] = [maj, min, pat].map(n => parseInt(n, 10));

  //   // if (release) {
  //   //   throw new Error(`Cannot make a production build of a dev version.`);
  //   // }
  //   // else {
  //   //   // NOTE: if there is no "dev" version, there is no need to downgrade
  //   // }
  // }
  return version;
}


// ###########################################################################
// 
// ###########################################################################


module.exports = {
  makeAbsolutePaths,
  
  readPackageJson,
  readPackageJsonVersion,
  getDependenciesPackageJson: readPackageJsonDependencies,

  writePackageJson,
  writeMergePackageJson,
  
  makeResolve,
  makeResolvePackageJson,
  readLernaJson,
  getDbuxVersion
};