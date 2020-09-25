/* eslint no-console: 0 */

/**
 * Process wrapper for running things in the VSCode terminal and communicating
 * process information back to caller extension.
 */
const spawn = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');

const Verbose = true;
const runningTimeout = 10000;

let cwd, command, tmpFolder, moreEnv;

const logDebug = (console.debug || console.log).bind(console);

function main() {
  // node run.js port "cwd" "command"
  const [
    _node,
    _runJs,
    argsEncoded
  ] = process.argv;

  const args = JSON.parse(Buffer.from(argsEncoded, 'base64').toString('ascii'));
  ({ cwd, command, tmpFolder, args: moreEnv } = args);

  logDebug('run.js command received:', args);

  const processOptions = {
    cwd,
    detached: false,
    stdio: "inherit",
    env: {
      ...process.env,
      ...moreEnv
    }
  };

  logDebug('node', _node, 'cwd', process.cwd());


  // run it!
  const child = spawn.exec(command, processOptions);

  const startTime = new Date();
  const warningIntervalId = setInterval(() => {
    let seconds = ((new Date()) - startTime) / 1000;
    logDebug(`Task running for ${seconds.toFixed(2)} seconds.`);
  }, runningTimeout);


  // ###########################################################################
  // process monitoring
  // ###########################################################################

  // done
  let done = false;
  function checkDone() {
    if (done) {
      return true;
    }
    done = true;

    return false;
  }


  child.on('exit', (code, signal) => {
    // logger.debug(`process exit, code=${code}, signal=${signal}`);
    if (checkDone()) { return; }

    reportStatusCode(code);
    clearInterval(warningIntervalId);

    logDebug(`\n(Done. You can close the Terminal now.)`);
  });

  child.on('error', (err) => {
    if (checkDone()) { return; }

    reportError(`[${err.code}] ${err.stack || JSON.stringify(err)}`);
    clearInterval(warningIntervalId);

    console.error(`Error:`, err);
  });

  // inherit stdio
  child.stdout.pipe(process.stdout);
  process.stdin.pipe(child.stdin);
  child.stderr.pipe(process.stderr);
}


// ###########################################################################
// handle results + send data
// ###########################################################################

function reportStatusCode(code) {
  fs.writeFileSync(path.join(tmpFolder, code.toString()), '');
}

function reportError(error) {
  try {
    fs.writeFileSync(path.join(tmpFolder, 'error'), error);
  }
  catch (err) {
    // if everything fails, make sure, our terminal does not close abruptly
    console.error('failed to write error', err);
  }
}


try {
  // go!
  main();
}
catch (err) {
  reportError(`_dbux_run failed: ${err.stack}`);
}
finally {
  setInterval(() => { }, 100000);
}