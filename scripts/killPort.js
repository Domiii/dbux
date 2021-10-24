const sh = require('shelljs');

const port = process.argv[2];
console.log(`looking for port=${port}`);

// TODO: windows only
// TODO: consider https://github.com/ksathyanm/find-pid-from-port/blob/main/index.js
const s = sh.exec(`netstat -ano | findstr "TCP" | findStr "${port}"`);
console.log(
  s
);
