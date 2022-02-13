/**
 * @file
 * @see https://thisdavej.com/making-interactive-node-js-console-apps-that-listen-for-keypress-events/
 */

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', async (str, key) => {
  console.log('keypress start');
  await 0;
  if (key.ctrl && key.name === 'q') {
    process.exit();
  } else {
    // console.log(`You pressed the "${str}" key`);
    // console.log();
    console.log(key);
  }
  await 0;
  console.log('keypress end');
});

console.log('Press any key...');