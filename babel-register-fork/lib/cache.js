"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveFile = saveFile;
exports.loadFile = loadFile;
exports.makeCacheFilename = makeCacheFilename;
exports.makeCacheKey = makeCacheKey;
exports.get = get;
// exports.setDirty = setDirty;
exports.clear = clear;

var path = require("path");

var fs = require("fs");

var _os = require("os");

var babel = require("@babel/core");

var _findCacheDir = require("find-cache-dir");

const DEFAULT_CACHE_DIR = _findCacheDir({
  name: "@babel/register"
}) || _os.homedir() || _os.tmpdir();

const DEFAULT_FILENAME = path.join(DEFAULT_CACHE_DIR, `.babel.${babel.version}.${babel.getEnv()}.json`);

const FILENAME = process.env.BABEL_CACHEpath || DEFAULT_FILENAME;
let data = {};
// let cacheDirty = false;
let cacheDisabled = false;

function isCacheDisabled() {
  var _process$env$BABEL_DI;

  return (_process$env$BABEL_DI = process.env.BABEL_DISABLE_CACHE) != null ? _process$env$BABEL_DI : cacheDisabled;
}

function makeCacheFilename(srcFilename) {

}

function makeCacheKey(opts) {
  let cacheKey = `${JSON.stringify(opts)}:${babel.version}`;
  const env = babel.getEnv(false);
  if (env) cacheKey += `:${env}`;
  return cacheKey;
}

function saveFile(filename, cacheKey, value) {
  let serialised = '';
  try {
    value.cacheKey = cacheKey;
    serialised = JSON.stringify(value);
  } catch (err) {
    if (err.message === "Invalid string length") {
      err.message = `Cache too large, cannot save: ${filename}`;
      console.error(err.stack);
      return;
    } else {
      throw err;
    }
  }

  try {
    fs.mkdirSync(path.dirname(FILENAME), { recursive: true });
    fs.writeFileSync(FILENAME, serialised);
  } catch (e) {
    switch (e.code) {
      case "ENOENT":
      case "EACCES":
      case "EPERM":
        console.warn(`Babel could not write cache to file: ${FILENAME}
due to a permission issue. Cache is disabled.`);
        cacheDisabled = true;
        break;

      case "EROFS":
        console.warn(`Babel could not write cache to file: ${FILENAME}
because it resides in a readonly filesystem. Cache is disabled.`);
        cacheDisabled = true;
        break;

      default:
        throw e;
    }
  }
}

function loadFile(filename, cacheKey) {
  let serialized;
  try {
    serialized = fs.readFileSync(filename);
  } catch (err) {
    switch (err.code) {
      case "EACCES":
        console.warn(`Babel could not read cache file: ${filename}
due to a permission issue. Cache is disabled.`);
        cacheDisabled = true;
        break;
      default:
        console.warn(`Babel could not read cache file: ${filename} - ${err.stack || err}`);
        return null;
    }
  }

  try {
    const value = JSON.parse(serialized);
    const { code, map, cacheKey } = value;
    // TODO: validate cacheKey
    return { code, map };
  } catch (err) {
    console.warn(`Babel could not read cache file: ${filename} - ${err.stack || err}`);
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
  return data;
}

// function setDirty() {
//   cacheDirty = true;
// }

function clear() {
  // TODO: delete all cached files?
  data = {};
}