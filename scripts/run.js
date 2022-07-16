const path = require('path');
const sh = require('shelljs');

/**
 * This is worse than `exec` because it buffers all output until the command has finished.
 */
module.exports = function run(command, cwd, options) {
  const {
    silent
  } = options || {};
  cwd = cwd || path.resolve(path.join(__dirname, '..'));
  console.debug(` ${cwd}$ ${command}`);
  const result = sh.exec(command, { cwd, silent: true });

  if (!silent) {
    if (result.stdout) {
      console.debug('  ', result.stdout);
    }
    if (result.stderr) {
      console.error('  ', result.stderr);
    }
  }

  if (result.code) {
    throw new Error(`Command "${command}" failed, exit status: ${result.code}`);
  }

  return result.stdout.trim();
};
