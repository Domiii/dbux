const process = require('process');

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


export function exitProcess(code = 0) {
  console.debug('exiting...');
  process.exit(code);
}