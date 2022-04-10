const inspect = require("util").inspect.custom;

class WebpackError extends Error {
  [inspect]() {
    return '[THIS IS A CUSTOM ERROR] ' + this.stack;
  }
}

console.log(new Error('OUCH'));