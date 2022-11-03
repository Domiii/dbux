const cloneDeep = require("clone-deep");
const sourceMapSupport = require("source-map-support");
const registerCache = require("./cache");
const babel = require("@babel/core");
const { OptionManager, DEFAULT_EXTENSIONS } = require("@babel/core");
const { addHook } = require("pirates");
const path = require("path");
const Module = require("module");

// const Verbose = 1;
const Verbose = 0;

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
let cachePrepared = false;

function compile(code, srcFilename) {
  // merge in base options and resolve all the plugins and presets relative to this file
  // sourceRoot can be overwritten
  const sourceRootOverride = path.dirname(srcFilename) + path.sep;

  const options = {
    ...cloneDeep(transformOpts),
    sourceRoot: sourceRootOverride,
    filename: srcFilename,
  };
  const opts = new OptionManager().init(options);


  Verbose && console.log(`[@babel/register] TRANSFORM: ${srcFilename} --`, opts?.plugins?.map(p => p.key));

  // Bail out ASAP if the file has been ignored.
  if (opts === null) return code;


  let cacheFilename, cacheKey, cached;
  if (cacheEnabled) {
    if (!cachePrepared) {
      // prepare cache root and directory
      registerCache.prepareCache(transformOpts.sourceRoot, srcFilename);
      cachePrepared = true;
    }

    // load from cache
    cacheFilename = registerCache.makeCacheFilename(srcFilename);
    cacheKey = registerCache.makeCacheKey(opts);
    // console.warn(`[@babel/register] loading file ${cacheFilename}`);
    cached = registerCache.loadFile(srcFilename, cacheFilename, cacheKey);
  }

  
  const sourceMaps = opts.sourceMaps === undefined ? false : opts.sourceMaps;
  if (!cached) {
    // transform
    cached = babel.transform(code, {
      ...opts,
      sourceMaps,
      ast: false
    });

    if (cacheFilename) {
      // save cache
      // console.warn(`[@babel/register] caching file ${cacheFilename}`);
      registerCache.saveFile(srcFilename, cacheFilename, cacheKey, cached);
    }
  }
  else {
    if (!sourceMaps) {
      delete cached.map;
    }
  }
  // console.debug(`[@babel/register -> compile] ${srcFilename}: ${code}`);

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
  }
  catch (err) {
    err.message = `Failed to compile "${filename}" - ${err.message}`;
    throw err;
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

  if (arguments.length) {
    // NOTE: `register` is called once by its own `nodeWrapper` with no `opts`; which will be overwritten by the user call to `register` later.
    // console.trace('[@babel/register] cacheEnabled=', cacheEnabled, opts.cache, 'process.env.BABEL_DISABLE_CACHE=', process.env.BABEL_DISABLE_CACHE);
  }

  delete opts.extensions;
  delete opts.cache;

  transformOpts = {
    ...opts,
    configFile: false,  // TODO!
    caller: {
      name: "@babel/register",
      ...(opts.caller || {}),
    },
  };

  // console.trace(JSON.stringify(transformOpts));

  let { cwd = "." } = transformOpts;

  // Ensure that the working directory is resolved up front so that
  // things don't break if it changes later.
  cwd = transformOpts.cwd = path.resolve(cwd);

  if (transformOpts.ignore === undefined && transformOpts.only === undefined) {
    // Verbose && console.debug('[@dbux/babel-register-fork] NOTE: no `ignore` in options → ignoring node_modules');
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
