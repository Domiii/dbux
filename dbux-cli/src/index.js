console.log('started');

import babel from 'babel-core';

const fs = require('fs').promises;

const source = `\
function noop() {}
noop();
`;

const {
  code, map, ast
} = babel.transform(source, {
  "plugins": [
    "transform-runtime",
  ]
});


const targetFile = __dirname + '/_test/test1.js';
fs.writeFile(targetFile, code);
console.log("wrote file: " + targetFile);