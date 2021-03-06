import fs from 'fs';
import path from 'path';

export function buildCommonCommandOptions() {
  return {
    esnext: {
      describe: 'Add esnext babel presets + options.',
      default: false,
      type: 'boolean'
    },
    dontInjectDbux: {
      alias: ['d'],
      describe: 'Do NOT inject Dbux. Allows for running the same code while easily switching between dbux and non-dbux runs.',
      default: false,
      type: 'boolean'
    },
    dontAddPresets: {
      alias: ['p'],
      describe: 'Do NOT add `@babel/preset-env`. Not adding this, might cause incompatabilities, but keeps the code closer to its original form.',
      default: false,
      type: 'boolean'
    },
    verbose: {
      // eslint-disable-next-line max-len
      describe: 'Passes the verbose option to @dbux/babel-plugin, which will then report all instrumented files. --verbose=1 only logs instrumented files when they get require\'d, --verbose=x with x > 1 logs **all** files.',
      default: 0,
      type: 'number'
    },
    env: {
      describe: "Specify environment variables for program. Format: --env=\"x=1,y=hello world\"",
      default: '',
      type: 'string',
    },
    packageWhitelist: {
      alias: ['pw'],
      describe: "Specify which packages will be instrumented.",
      default: '',
      // type: 'array',
    },
    runtime: {
      alias: ['rt'],
      describe: 'Runtime config (JSON.stringify)',
      // example: "{\"tracesDisabled\":1}"
      default: null
    },
    require: {
      alias: ['r'],
      describe: 'Require files, after babel/register, but before doing the actual work.',
      // example: "{\"tracesDisabled\":1}"
      default: null
    }
  };
}

/**
 * Some options require extra work, before executing the actual command.
 */
export function processRemainingOptions(options) {
  const {
    require: req
  } = options;

  // console.warn('require', req);
  if (req) {
    req.split(',').forEach(f => {
      f = path.resolve(process.cwd(), f);
      // eslint-disable-next-line import/no-dynamic-require
      const requireFunc = typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;
      requireFunc(f);
    });
  }
}

export function resolveCommandTargetPath(file) {
  try {
    const fpath = fs.realpathSync(file);
    return fpath;
  }
  catch (err) {
    throw new Error(`Could not resolve file: "${file}" - ${err.message}`);
  }
}