import fs from 'fs';

export function buildCommonCommandOptions() {
  return {
    vanilla: {
      alias: ['v'],
      describe: 'Do not add default babel presets + options. Just run as-is.',
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
    }
  };
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