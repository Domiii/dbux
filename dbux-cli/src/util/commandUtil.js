import process from 'process';
import NestedError from '@dbux/common/src/NestedError';
import sleep from '@dbux/common/src/util/sleep';

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
      // throw ;
      console.error(new NestedError('[@dbux/cli] command failed', err));
      exitProcess(-1);
    }
  };
}


export async function exitProcess(code = 0) {
  const dbux = globalThis.__dbux__;
  do {
    // give it some time to send out all data
    const ms = 20000;
    const details = dbux && ` (finished=${dbux.client.hasFinished()})` || '';
    console.debug(`[@dbux/cli] waiting ${Math.round(ms / 1000)}s for process to finish...${details}`);
    await sleep(ms);
  }
  while (dbux?.client && !dbux.client.hasFinished());
  console.debug('exiting...');
  process.exit(code);
}
