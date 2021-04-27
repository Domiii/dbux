/* eslint no-console: 0 */

/**
 * Process wrapper for running things in the VSCode terminal and communicating
 * process information back to caller extension.
 */
const spawn = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');
const { inspect } = require('util');

const Verbose = true;
const runningTimeout = 10000;

let cwd, command, tmpFolder, options;

const logDebug = (console.debug || console.log).bind(console, '[Dbux]');

const [
  _node,
  _runJs,
  interactive,
  argsEncoded
] = process.argv;

function main() {
  // node run.js port "cwd" "command"
  const args = JSON.parse(Buffer.from(argsEncoded, 'base64').toString('ascii'));
  ({ cwd, command, tmpFolder, options = {} } = args);

  const {
    env: moreEnv
  } = options;

  logDebug('run.js command received:', inspect(args));

  const processOptions = {
    cwd,
    detached: false,
    stdio: "inherit",
    env: {
      ...process.env,
      ...moreEnv
    }
  };

  logDebug('node:', _node, ', cwd:', process.cwd());


  // run it!
  const child = spawn.exec(command, processOptions);

  const startTime = new Date();
  const warningIntervalId = setInterval(() => {
    let seconds = ((new Date()) - startTime) / 1000;
    logDebug(`(Terminal task running for ${seconds.toFixed(2)} seconds.)`);
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

    reportStatusCode(code, signal);
    clearInterval(warningIntervalId);

    // logDebug(`\n(Done. You can close the Terminal now.)`);

    // if (interactive) {
    //   setTimeout(() => process.exit(0), 300);
    // }
  });

  child.on('error', (err) => {
    if (checkDone()) { return; }

    reportError(new Error(`Child on error with code: ${err.code}, stack trace: ${err.stack}`));
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

function reportStatusCode(code, signal) {
  if (!signal) {
    // odd: sometimes code is undefined?
    fs.writeFileSync(path.join(tmpFolder, code?.toString() || '0'), '');
  }
  else {
    reportError(`Exited with SIGNAL = ${signal} (code = ${code})`);
  }
}

function reportError(error) {
  try {
    let errorString = JSON.stringify({
      message: error.message,
      stack: error.stack,
    });
    fs.writeFileSync(path.join(tmpFolder, 'error'), errorString);
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
  reportError(err);
}
finally {
  // see https://stackoverflow.com/questions/44137481/prevent-nodejs-program-from-exiting
  // console.debug('interactive', interactive);
  // (!interactive ? setInterval : setTimeout)(() => { }, interactive ? 500 : 100000);
  // setInterval(() => { console.debug('keep running'); }, 100);
  // process.stdin.resume();
}