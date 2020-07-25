export function buildCommonCommandOptions() {
  return {
    vanilla: {
      alias: ['v'],
      describe: 'Do not add default babel presets + options. Just run as-is.',
      default: false,
      type: 'boolean'
    },
    injectDbux: {
      alias: ['d'],
      describe: 'Whether to inject Dbux. Allows for running the same code while easily switching between dbux and non-dbux runs.',
      default: true,
      type: 'boolean'
    },
    addPresets: {
      alias: ['p'],
      describe: 'Whether to add `@babel/preset-env`. Not adding this, might cause incompatabilities, but keeps the code closer to its original form.',
      default: true,
      type: 'boolean'
    }
  };
}