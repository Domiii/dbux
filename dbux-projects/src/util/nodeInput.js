const readline = require('readline');

const cmd = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Emulate Python's `input` function.
 */
export async function input(prompt) {
  return new Promise(r => cmd.question(prompt, r));
}

/**
 * Emulate C++'s `getline` function.
 */
export async function getline() {
  return new Promise(r => cmd.once('line', r));
}