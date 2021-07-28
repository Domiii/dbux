"use strict";

exports.saveFile = saveFile;
exports.loadFile = loadFile;
exports.makeCacheFilename = makeCacheFilename;
exports.makeCacheKey = makeCacheKey;
exports.get = get;
// exports.setDirty = setDirty;
exports.clear = clear;

var path = require("path");
var fs = require("fs");
var os = require("os");
var babel = require("@babel/core");
var findCacheDir = require("find-cache-dir");

const CACHE_DIR = process.env.BABEL_CACHE_PATH || findCacheDir({
  name: "@babel/register"
}) || os.homedir() || os.tmpdir();

// const DEFAULT_FILENAME = path.join(DEFAULT_CACHE_DIR, `.babel.${babel.version}.${babel.getEnv()}.json`);
// const FILENAME = process.env.BABEL_CACHE_PATH || DEFAULT_FILENAME;

// let data = {};
// let cacheDirty = false;
let cacheDisabled = false;

function mtime(filename) {
  return +fs.statSync(filename).mtime;
}

function isCacheDisabled() {
  var _process$env$BABEL_DI;

  return (_process$env$BABEL_DI = process.env.BABEL_DISABLE_CACHE) != null ? _process$env$BABEL_DI : cacheDisabled;
}

function getEnvName() {
  // NOTE: `getEnv` is not documented
  //    see https://github.com/babel/babel/blob/master/packages/babel-core/src/config/helpers/environment.js
  return babel.getEnv(false) || 'default';
}

function makeCacheFilename(srcFilename, opts) {
  const { sourceRoot } = opts;
  const relativePath = path.relative(sourceRoot, srcFilename);
  return path.resolve(CACHE_DIR, getEnvName(), relativePath);
}

function makeCacheKey(opts) {
  // NOTE: we don't need `getEnvName` here because the filename already has it
  // TODO: replace JSON.stringify because it is not able to get plugin versions etc.
  return `${babel.version}:${JSON.stringify(opts)}`;
}

function saveFile(srcFilename, cacheFilename, cacheKey, cached) {
  let serialised;
  try {
    cached.cacheKey = cacheKey;
    cached.mtime = mtime(srcFilename);
    serialised = JSON.stringify(cached);
  } catch (err) {
    if (err.message === "Invalid string length") {
      err.message = `Cache too large, cannot save: ${cacheFilename}`;
      console.error(err.stack);
      return;
    } else {
      throw err;
    }
  }

  try {
    fs.mkdirSync(path.dirname(cacheFilename), { recursive: true });
    fs.writeFileSync(cacheFilename, serialised);
  } catch (e) {
    switch (e.code) {
      case "ENOENT":
      case "EACCES":
      case "EPERM":
        console.warn(`Babel could not write cache to file: ${cacheFilename}
due to a permission issue. Cache is disabled.`);
        cacheDisabled = true;
        break;

      case "EROFS":
        console.warn(`Babel could not write cache to file: ${cacheFilename}
because it resides in a readonly filesystem. Cache is disabled.`);
        cacheDisabled = true;
        break;

      default:
        throw e;
    }
  }
}

function loadFile(srcFilename, cacheFilename, cacheKey) {
  let serialized;
  try {
    serialized = fs.readFileSync(cacheFilename);
  } catch (err) {
    switch (err.code) {
      case "ENOENT":
        // file does not exist -> nothing to do
        return null;
      case "EACCES":
        console.warn(`Babel could not read cache file: ${cacheFilename}
due to a permission issue. Cache is disabled.`);
        cacheDisabled = true;
        break;
      default:
        console.warn(`Babel could not read cache file: ${cacheFilename} - ${err.stack || err}`);
        return null;
    }
  }

  try {
    const cached = JSON.parse(serialized);

    // validate cacheKey
    if (cacheKey !== cached.cacheKey) {
      return null;
    }

    // validate mtime
    if (cached.mtime !== mtime(srcFilename)) {
      return null;
    }

    const { code, map } = cached;
    return { code, map };
  } catch (err) {
    console.warn(`Babel could not read cache file: ${cacheFilename} - ${err.stack || err}`);
  }
  return null;
}


// /**
//  * Old version of save()
//  */
// function save() {
//   if (isCacheDisabled() || !cacheDirty) return;
//   cacheDirty = false;
//   let serialised = "{}";

//   try {
//     serialised = JSON.stringify(data, null, "  ");
//   } catch (err) {
//     if (err.message === "Invalid string length") {
//       err.message = "Cache too large so it's been cleared.";
//       console.error(err.stack);
//     } else {
//       throw err;
//     }
//   }

//   try {
//     fs.mkdirSync(path.dirname(FILENAME), { recursive: true });
//     fs.writeFileSync(FILENAME, serialised);
//   } catch (e) {
//     switch (e.code) {
//       case "ENOENT":
//       case "EACCES":
//       case "EPERM":
//         console.warn(`Babel could not write cache to file: ${FILENAME}
// due to a permission issue. Cache is disabled.`);
//         cacheDisabled = true;
//         break;

//       case "EROFS":
//         console.warn(`Babel could not write cache to file: ${FILENAME}
// because it resides in a readonly filesystem. Cache is disabled.`);
//         cacheDisabled = true;
//         break;

//       default:
//         throw e;
//     }
//   }
// }

// /**
//  * old version of load()
//  */
// function load() {
//   if (isCacheDisabled()) {
//     data = {};
//     return;
//   }

//   process.on("exit", save);
//   process.nextTick(save);
//   let cacheContent;

//   try {
//     cacheContent = fs.readFileSync(FILENAME);
//   } catch (e) {
//     switch (e.code) {
//       case "EACCES":
//         console.warn(`Babel could not read cache file: ${FILENAME}
// due to a permission issue. Cache is disabled.`);
//         cacheDisabled = true;

//       default:
//         return;
//     }
//   }

//   try {
//     data = JSON.parse(cacheContent);
//   } catch (_unused) {}
// }

function get() {
  return !isCacheDisabled();
}

// function setDirty() {
//   cacheDirty = true;
// }

function clear() {
  // delete cache directory
  fs.rmdirSync(CACHE_DIR, { recursive: true });
  // data = {};
}