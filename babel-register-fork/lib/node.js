const cloneDeep = require("clone-deep");
const sourceMapSupport = require("source-map-support");
const registerCache = require("./cache");
const babel = require("@babel/core");
const { OptionManager, DEFAULT_EXTENSIONS } = require("@babel/core");
const { addHook } = require("pirates");
const path = require("path");
const Module = require("module");

exports.revert = revert;
exports.default = register;

const maps = {};
let transformOpts = {};
let piratesRevert = null;

function installSourceMapSupport() {
  sourceMapSupport.install({
    handleUncaughtExceptions: false,
    environment: "node",
    retrieveSourceMap(source) {
      const map = maps && maps[source];
      if (map) {
        return {
          url: null,
          map: map,
        };
      } else {
        return null;
      }
    },
  });
}


let cacheEnabled;
let firstSourceRoot;

function compile(code, srcFilename) {
  // merge in base options and resolve all the plugins and presets relative to this file
  const opts = new OptionManager().init(
    // sourceRoot can be overwritten
    {
      sourceRoot: path.dirname(srcFilename) + path.sep,
      ...cloneDeep(transformOpts),
      filename: srcFilename,
    },
  );

  // Bail out ASAP if the file has been ignored.
  if (opts === null) return code;

  if (!firstSourceRoot) {
    // future-work: be smarter about this - take config value -> look for `package.json` -> take first srcFilename
    firstSourceRoot = opts.sourceRoot;
  }


  let cacheFilename, cacheKey, cached;
  if (cacheEnabled) {
    // load cache
    cacheFilename = registerCache.makeCacheFilename(srcFilename, firstSourceRoot);
    cacheKey = registerCache.makeCacheKey(opts);

    // console.warn(`[@babel/register] loading file ${cacheFilename}`);
    cached = registerCache.loadFile(srcFilename, cacheFilename, cacheKey);
  }

  if (!cached) {
    // transform
    cached = babel.transform(code, {
      ...opts,
      sourceMaps: opts.sourceMaps === undefined ? "both" : opts.sourceMaps,
      ast: false
    });

    if (cacheEnabled) {
      // save cache
      // console.warn(`[@babel/register] caching file ${cacheFilename}`);
      registerCache.saveFile(srcFilename, cacheFilename, cacheKey, cached);
    }
  }

  if (cached.map) {
    if (Object.keys(maps).length === 0) {
      installSourceMapSupport();
    }
    maps[srcFilename] = cached.map;
  }

  return cached.code;
}


let compiling = false;
const internalModuleCache = Module._cache;

function compileHook(code, filename) {
  if (compiling) return code;

  const globalModuleCache = Module._cache;
  try {
    compiling = true;
    Module._cache = internalModuleCache;
    return compile(code, filename);
  } finally {
    compiling = false;
    Module._cache = globalModuleCache;
  }
}

function hookExtensions(exts) {
  if (piratesRevert) piratesRevert();
  piratesRevert = addHook(compileHook, { exts, ignoreNodeModules: false });
}

function revert() {
  if (piratesRevert) piratesRevert();
}

function escapeRegExp(string) {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}

function register(opts) {
  // Clone to avoid mutating the arguments object with the 'delete's below.
  opts = {
    ...opts,
  };
  hookExtensions(opts.extensions || DEFAULT_EXTENSIONS);

  if (opts.cache === false && cacheEnabled) {
    registerCache.clear();
    cacheEnabled = false;
  } else if (opts.cache !== false && !cacheEnabled) {
    // registerCache.load();
    cacheEnabled = registerCache.get();
  }
  // console.warn(`[@babel/register] cacheEnabled=${cacheEnabled}`);

  delete opts.extensions;
  delete opts.cache;

  transformOpts = {
    ...opts,
    caller: {
      name: "@babel/register",
      ...(opts.caller || {}),
    },
  };

  let { cwd = "." } = transformOpts;

  // Ensure that the working directory is resolved up front so that
  // things don't break if it changes later.
  cwd = transformOpts.cwd = path.resolve(cwd);

  if (transformOpts.ignore === undefined && transformOpts.only === undefined) {
    transformOpts.only = [
      // Only compile things inside the current working directory.
      // $FlowIgnore
      new RegExp("^" + escapeRegExp(cwd), "i"),
    ];
    transformOpts.ignore = [
      // Ignore any node_modules inside the current working directory.
      new RegExp(
        "^" +
        // $FlowIgnore
        escapeRegExp(cwd) +
        "(?:" +
        path.sep +
        ".*)?" +
        // $FlowIgnore
        escapeRegExp(path.sep + "node_modules" + path.sep),
        "i",
      ),
    ];
  }
}
