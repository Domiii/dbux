const process = require('process');
const sleep = require('@dbux/common/src/util/sleep').default;

export function wrapCommand(commandCallback) {
  return async argv => {
    let keepOpen;
    try {
      /* keepOpen = */ await commandCallback(argv);
      // if (!keepOpen) {
      //   exitProcess();
      // }
    }
    catch (err) {
      console.error('@dbux/cli command failed:', err);
      exitProcess(-1);
    }
  };
}


export async function exitProcess(code = 0) {
  await sleep(10000);    // give it some time to send out all data
  console.debug('exiting...');
  process.exit(code);
}
