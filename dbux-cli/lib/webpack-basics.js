function deserializeWebpackInput(s) {
  return JSON.parse(JSON.parse(s));
}


function parseEnv(env) {
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
        console.warn(option.join('='));
        option[1] = JSON.parse(option[1]);
      }
      return option;
    })
  );
}

module.exports = { deserializeWebpackInput, parseEnv };