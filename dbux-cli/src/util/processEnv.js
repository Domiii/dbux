
/**
 * @param {string} env 
 */
export function processEnv(env) {
  let options = env.split(',');
  for (let option of options) {
    let [key, value] = option.split('=');
    process.env[key] = value;
  }
}
