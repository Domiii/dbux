const sh = require('shelljs');

const port = process.argv[2];
console.log(`looking for port=${port}`);

// TODO: windows only
// TODO: consider https://github.com/ksathyanm/find-pid-from-port/blob/main/index.js
/**
 * e.g.:
 * X = lastWordOf(
 *  netstat -ano | findstr "TCP" | findStr "3844"
 * )
 * kill -f X
 */
const s = sh.exec(`netstat -ano | findstr "TCP" | findStr "${port}"`);
console.log(
  s
);
