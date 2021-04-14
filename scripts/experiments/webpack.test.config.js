

// cd scripts/experiments
// npx webpack --config webpack.test.config.js --env a='"1"' --env b='"{\"x\":1,\"y\":\"hi123\"}"'

// `--env a='${JSON.stringify(JSON.stringify(1))}' --env b='${JSON.stringify(JSON.stringify({x:1, y: 'hi123'}))}'`

// --env a=1 --env b='{\"x\":1,\"y\":\"hi123\"}'

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
        // console.warn(option.join('='));
        option[1] = JSON.parse(option[1]);
      }
      return option;
    })
  );
}

module.exports = function cfg(env, argv) {
  env = parseEnv(env);
  console.warn('env:', JSON.stringify(env, null, 2));
  // console.warn('env.b:', JSON.stringify(env.b, null, 2));

  return {};
}