import requireDynamic from '@dbux/common/src/util/requireDynamic';
import fs from 'fs';
import path from 'path';

export function buildCommonCommandOptions() {
  return {
    esnext: {
      describe: 'Add esnext babel presets + options.',
      default: false,
      type: 'boolean'
    },
    cache: {
      describe: 'Whether to cache instrumented results.',
      // disable by default for development + testing
      default: process.env.NODE_ENV === 'production',
      type: 'boolean'
    },
    sourceRoot: {
      // eslint-disable-next-line max-len
      describe: 'If cache is enabled, this is used to determine the relative file path of cached files. If not provided, will use heuristics to find appropriate folder automatically.',
      default: undefined,
      type: 'String'
    },
    dontInjectDbux: {
      alias: ['d'],
      describe: 'Do NOT inject Dbux. Allows for running the same code while easily switching between dbux and non-dbux runs.',
      default: false,
      type: 'boolean'
    },
    dontAddPresets: {
      alias: ['p'],
      // eslint-disable-next-line max-len
      describe: 'This is only used in combination with `--esnext`. If set, this will add some plugins, but NOT add `@babel/preset-env`. Not adding this, might cause incompatabilities, but keeps the code closer to its original form.',
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
      describe: "Package name regex. Only matches against `node_modules`.",
      default: '',
      type: 'string',
      // type: 'array',
    },
    packageBlacklist: {
      alias: ['pb'],
      describe: "Package name regex. Only matches against `node_modules`.",
      default: '',
      type: 'string',
      // type: 'array',
    },
    fileWhitelist: {
      alias: ['fw'],
      describe: "Full file path regex.",
      default: '',
      type: 'string',
      // type: 'array',
    },
    fileBlacklist: {
      alias: ['fb'],
      describe: "Full file path regex.",
      default: '',
      type: 'string',
      // type: 'array',
    },
    runtime: {
      alias: ['rt'],
      describe: 'Runtime config (JSON format)',
      // example: "{\"tracesDisabled\":1}", "{\"valuesDisabled\":1}"
      default: null
    },
    require: {
      alias: ['r'],
      describe: 'Require files, after babel/register, but before doing the actual work.',
      default: null
    },
    targets: {
      type: 'string',
      describe: 'Babel targets descriptor in JSON format (see https://babeljs.io/docs/en/babel-preset-env#targets)',
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
      requireDynamic(f);
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