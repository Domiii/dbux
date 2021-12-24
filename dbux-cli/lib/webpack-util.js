const isString = require('lodash/isString');
const isPlainObject = require('lodash/isPlainObject');

function deserializeWebpackInput(s) {
  return JSON.parse(JSON.parse(s));
}


function parseEnv(env) {
  if (!env) {
    return {};
  }
  try {
    if (isString(env)) {
      env = [env];
    }
    else if (isPlainObject(env)) {
      env = Object.entries(env);
    }
    return Object.fromEntries(
      env.map(option => {
        console.debug(` [env] ${option}`);
        // let option = optionString.split('=');
        if (isString(option[1])) {
          // if (option.length === 1) {
          //   option.push(true);
          // }
          // else {
          // console.warn(option.join('='));
          // option[1] = JSON.parse(option[1]);
          option[1] = JSON.parse(Buffer.from(option[1], 'base64').toString('ascii'));
          // // eslint-disable -next-line no-eval
          // option[1] = eval(option[1]);
          // }
        }
        return option;
      })
    );
  }
  catch (err) {
    const msg = `Unable to parse env - ${JSON.stringify(env)}`;
    const err2 = new /* NestedError */Error(msg);
    err2.stack = `${msg}\n------------\n  nested: ${err.stack}`;
    throw err2;
  }
}

module.exports = { 
  deserializeWebpackInput, 
  parseEnv
};