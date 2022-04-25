// test.js
const cp = require('child_process');

const cmd = 'echo hi && "C:/Program Files/Volta/yarn" install';
const child = cp.exec(cmd);

// ###########################################################################
// process monitoring
// ###########################################################################

child.on('exit', (code, signal) => {
  console.log('Done - code', code, ' signal', signal);
});

child.on('error', (err) => {
  console.error(`Error:`, err);
});

// inherit stdio
child.stdout.pipe(process.stdout);
process.stdin.pipe(child.stdin);
child.stderr.pipe(process.stderr);