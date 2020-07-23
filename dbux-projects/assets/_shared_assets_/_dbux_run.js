/* eslint no-console: 0 */

/**
 * Process wrapper for running things in the VSCode terminal and communicating
 * process information back to caller extension.
 */
const spawn = require('child_process');
const process = require('process');
const io = require('socket.io-client');

const Verbose = true;

// node run.js port "cwd" "command"
const [
  _node,
  _runJs,
  argsEncoded
] = process.argv;

const args = JSON.parse(Buffer.from(argsEncoded, 'base64').toString('ascii'));
const { port, cwd, command } = args;

console.debug('run.js command received:', args);

function main() {
  const processOptions = {
    cwd,
    detached: false,
    stdio: "inherit"
  };

  // TODO: use spawn instead of exec? (allows for better control but needs https://www.npmjs.com/package/string-argv)
  const child = spawn.exec(command, processOptions);

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
  });

  child.on('error', (err) => {
    if (checkDone()) { return; }

    reportError(`[${err.code}] ${err.message || JSON.stringify(err)}`);
  });

  // inherit stdio
  child.stdout.pipe(process.stdout);
  process.stdin.pipe(child.stdin);
  child.stderr.pipe(process.stderr);
}


// ###########################################################################
// handle results + send data
// ###########################################################################

let socket;
let queue = [];
let killTimer;
let sent = false;

const StayAwake = false;
const KillDelay = 1000;

function connect() {
  if (socket) {
    return;
  }

  const Remote = `ws://localhost:${port}`;
  socket = io.connect(Remote, {
    // jsonp: false,
    // forceNode: true,
    port,
    transports: ['websocket']
  });

  socket.on('reconnect_attempt', () => {
    Verbose && console.debug('[run.js] reconnecting...');
    // socket.io.opts.transports = ['websocket'];
  });
  socket.on('connect', () => {
    flushQueue();
  });
  socket.on('connect_error', (err) => Verbose && console.debug('[run.js] failed to connect', err));
  socket.on('error', (err) => console.error(`[run.js]`, err));
  socket.on('disconnect', () => {
    socket = null;
    console.warn('[run.js] disconnected');
    process.exit();
    if (!sent) {
      // we got disconnected but did not finish our thing yet
      // TODO: kill-tree the process?
    }
  });
}


function flushQueue() {
  console.debug('run.js flushQueue', 'results', queue);
  socket.emit('results', queue);
  queue = [];
  sent = true;

  _refreshKillTimer();
}

function _refreshKillTimer() {
  if (StayAwake) {
    // stay awake
    return;
  }

  // disconnect after a while
  if (killTimer) {
    clearTimeout(killTimer);
  }
  killTimer = setTimeout(() => socket.disconnect(true), KillDelay);
}

function sendData(data) {
  connect();

  queue.push(data);

  if (socket.connected) {
    flushQueue();
  }
}

function reportStatusCode(code) {
  sendData({
    code
  });
}

function reportError(error) {
  sendData({
    error
  });
}


// go!
main();