function deserializeWebpackInput(s) {
  return JSON.parse(JSON.parse(s));
}


function parseEnv(env) {
  if (!env) {
    return {};
  }
  if (!Array.isArray(env)) {
    env = [env];
  }
  return Object.fromEntries(
    env.map(optionString => {
      let option = optionString.split('=');
      if (option.length === 1) {
        option.push(true);
      }
      else {
        // console.warn(option.join('='));
        // option[1] = JSON.parse(option[1]);
        option[1] = JSON.parse(Buffer.from(option[1], 'base64').toString('ascii'));
        // // eslint-disable-next-line no-eval
        // option[1] = eval(option[1]);
      }
      return option;
    })
  );
}

module.exports = { deserializeWebpackInput, parseEnv };