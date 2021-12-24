/**
 * Keep track of original console output streams for logging and instrumentation purposes.
 */


const consoleOutputNames = [
  'debug',
  'log',
  'info',
  'warn',
  'error',
  'trace'
];

// grab the output streams first

const consoleOutputStreams = Object.fromEntries(
  consoleOutputNames.map(name =>
    // eslint-disable-next-line no-console
    [name, console[name]?.bind(console)]
  ).
    filter(([, out]) => !!out)
);

// fix up compatability

(function _compatabilityHackfix() {
  // NOTE: console.debug is not supported in some old environments. Babel also, for some reason, does not polyfill it.
  // eslint-disable-next-line no-console
  console.debug = console.debug || console.log;
})();

export {
  consoleOutputStreams
};
