const sh = require('shelljs');

const s = 'dbux-code/resources/dist/projects/javascript-algorithms';
const d = 'dbux_projects/javascript-algorithms';
// see https://stackoverflow.com/a/31438355/2228771
sh.cp('-rf', `${s}/{.[!.],..?,}*`, d);