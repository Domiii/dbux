"use strict";

exports.saveFile = saveFile;
exports.loadFile = loadFile;
exports.prepareCache = prepareCache;
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


const CACHE_VERBOSE = true;
// const CACHE_VERBOSE = false;

// const DEFAULT_FILENAME = path.join(DEFAULT_CACHE_DIR, `.babel.${babel.version}.${babel.getEnv()}.json`);
// const FILENAME = process.env.BABEL_CACHE_PATH || DEFAULT_FILENAME;

// let data = {};
// let cacheDirty = false;
let cacheDisabled = false;

/**
 * File paths are computed relative to `cacheRoot`
 */
let cacheRoot;

/**
 * The `cacheDir` contains all cache files.
 */
let cacheDir;

function mtime(filename) {
  return +fs.statSync(filename).mtime;
}

function isCacheDisabled() {
  // console.debug('isCacheDisabled()', process.env.BABEL_DISABLE_CACHE, cacheDisabled, process.env.BABEL_DISABLE_CACHE ?? cacheDisabled);
  return process.env.BABEL_DISABLE_CACHE ?? cacheDisabled;
}

function getEnvName() {
  // NOTE: `getEnv` is not documented
  //    see https://github.com/babel/babel/blob/master/packages/babel-core/src/config/helpers/environment.js
  return babel.getEnv(false) || 'default';
}


/**
 * @see https://stackoverflow.com/a/61640119/2228771
 */
function isSubPathOf(subPath, parentPath) {
  parentPath = normalize(parentPath);
  subPath = normalize(subPath);
  return subPath.startsWith(parentPath);
}
function normalize(p) {
  p = path.normalize(p);
  if (!p.endsWith(path.sep)) {
    p += path.sep;
  }
  return p;
}

function prepareCache(sourceRoot, firstFileName) {
  if (cacheRoot) {
    return;
  }

  const cacheFolderName = '@babel/register';

  // NOTE: `findCacheDir` uses several heuristics to find the nearest folder containing a `package.json` file
  //      We use that to determine the `cacheRoot`.
  cacheDir = process.env.BABEL_CACHE_PATH || findCacheDir({
    // if provided explicitely, start searching from `sourceRoot`, else from first file location
    cwd: sourceRoot || path.dirname(firstFileName),
    name: cacheFolderName
  });

  // guess a good cacheRoot from cacheDir, else sourceRoot, else firstFileName's directory.
  cacheRoot = path.resolve(
    (cacheDir ? path.resolve(cacheDir, '../../../..') : sourceRoot) || path.dirname(firstFileName)
  );

  if (!cacheDir) {
    // place cache in home or temp directories
    cacheDir = path.resolve(os.homedir() || os.tmpdir(), `.babelcache/${cacheFolderName}`);
  }

  CACHE_VERBOSE && console.debug(`[@babel/register] cacheRoot=${cacheRoot}, cacheDir=${cacheDir}`);
}

function makeCacheFilename(srcFilename) {
  if (!isSubPathOf(srcFilename, cacheRoot)) {
    // eslint-disable-next-line max-len
    console.warn(`[@babel/register] Could not cache results for file "${srcFilename}" because it is outside of sourceRoot ${cacheRoot}. Please set accurate "sourceRoot" in your babel config manually.`);
    return null;
  }
  srcFilename += '.babel.js';

  const relativePath = path.relative(cacheRoot, srcFilename);
  return path.resolve(cacheDir, getEnvName(), relativePath);
}

function makeCacheKey(opts) {
  // NOTE: we don't need `getEnvName` here because the filename already has it
  // TODO: replace JSON.stringify because it is not able to get plugin versions etc.
  return `${babel.version}:${JSON.stringify(opts)}`;
}

/**
 * Serialize, but so that the code is still readable.
 * future-work: add an option for performance optimization.
 */
function serialize(data) {
  // return JSON.stringify(data);
  const { code, ...otherData } = data;
  return `// ${JSON.stringify(otherData)}\n${code}`;
}

function deserialize(serializedBuffer) {
  if (!serializedBuffer) {
    return null;
  }
  const serialized = serializedBuffer.toString();
  // return JSON.parse(serialized);
  const idx = serialized.indexOf('\n');
  const otherData = JSON.parse(serialized.substring(3, idx));
  const code = serialized.substring(idx + 1);
  return { code, ...otherData };
}

function saveFile(srcFilename, cacheFilename, cacheKey, cached) {
  let serialised;
  try {
    cached.cacheKey = cacheKey;
    cached.mtime = mtime(srcFilename);
    serialised = serialize(cached);
  } catch (err) {
    // NOTE: this should not happen anymore
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

const CacheMissReason = {
  /**
   * sourceRoot not configured correctly, leading to files not being found in root.
   */
  FileNotInRoot: 1,
  /**
   * 
   */
  DoesNotExist: 2,
  FileAccess: 3,
  LoadError: 4,
  ParseError: 5,
  DifferentOptions: 6,
  FileModified: 7
};

function getCacheMissReasonString(reason) {
  const str = Object.entries(CacheMissReason).find(([, value]) => value === reason);
  if (!str) {
    throw new TypeError(`Invalid CacheMissReason does not exist: ${reason}`);
  }
  return str[0];
}

function reportCacheMiss(reason, srcFilename, cacheFilename, message) {
  if (!CACHE_VERBOSE) {
    return;
  }
  const details = ''; //` (cached at "${cacheFilename}")${message && ` - ${message}` || ''}`;
  console.debug(`[@babel/register] Cache miss [${getCacheMissReasonString(reason)}] for "${srcFilename}"${details}`);
}

function diffString(msg, aStr, bStr) {
  const leftChrs = 30;
  const rightChrs = 30;
  const a = [...aStr];
  const b = [...bStr];
  let start = a.findIndex((chr, i) => chr !== b[i]);
  if (start < 0) {
    return null;
  }

  const end = Math.min(start + rightChrs, aStr.length, bStr.length);
  // let ellipse = end === start + rightChrs ? '...' : '';

  start = Math.max(0, start - leftChrs);
  return `${msg}, starting at #${start}: >>>${aStr.substring(start, end)}<<< !== >>>${bStr.substring(start, end)}<<<`;
}

function loadFile(srcFilename, cacheFilename, cacheKey) {
  if (!cacheFilename) {
    reportCacheMiss(CacheMissReason.FileNotInRoot, srcFilename, cacheFilename);
    return null;
  }

  let serializedBuffer;
  try {
    serializedBuffer = fs.readFileSync(cacheFilename);
  } catch (err) {
    switch (err.code) {
      case "ENOENT":
        // file does not exist -> nothing to do
        reportCacheMiss(CacheMissReason.DoesNotExist, srcFilename, cacheFilename, err.message);
        break;
      case "EACCES":
        console.warn(`Babel could not read cache file due to a permission issue. Cache is disabled: ${err.message}`);
        reportCacheMiss(CacheMissReason.FileAccess, srcFilename, cacheFilename, err.message);
        cacheDisabled = true;
        break;
      default:
        reportCacheMiss(CacheMissReason.LoadError, srcFilename, cacheFilename, err && err.message || err);
        break;
    }
    return null;
  }

  try {
    const cached = deserialize(serializedBuffer);

    // validate cacheKey
    if (cacheKey !== cached.cacheKey) {
      // eslint-disable-next-line max-len
      reportCacheMiss(CacheMissReason.DifferentOptions, srcFilename, cacheFilename,
        diffString('cacheKeys are different', cacheKey, cached.cacheKey)
      );
      return null;
    }

    // validate mtime
    if (cached.mtime !== mtime(srcFilename)) {
      reportCacheMiss(CacheMissReason.FileModified, srcFilename, cacheFilename, 'mtime');
      return null;
    }

    const { code, map } = cached;
    return { code, map };
  } catch (err) {
    // console.warn(`Babel could not read cache file: ${cacheFilename}`);
    reportCacheMiss(CacheMissReason.ParseError, srcFilename, cacheFilename, err && err.message || err);

    // could not parse cache contents -> delete cache file
    fs.rmSync(cacheFilename);
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
  // delete cache directory?
  // fs.rmdirSync(CACHE_DIR, { recursive: true });
  // data = {};
}

// function deleteCache() {
//   fs.rmdirSync(CACHE_DIR, { recursive: true });
// }