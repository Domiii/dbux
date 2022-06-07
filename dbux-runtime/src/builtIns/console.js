import { consoleOutputStreams } from '@dbux/common/src/console';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import { peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchFunctionHolder, monkeyPatchMethod } from '../util/monkeyPatchUtil';
import { addPurpose } from './builtin-util';

export default function patchConsole() {
  if (!globalThis.console) {
    return;
  }

  // add console output overrides
  for (const [name/* , fn */] of Object.entries(consoleOutputStreams)) {
    monkeyPatchFunctionHolder(console, name,
      // eslint-disable-next-line no-loop-func
      (arr, args, originalFunction, patchedFunction) => {
        const bceTrace = peekBCEMatchCallee(patchedFunction);
        const result = originalFunction.apply(arr, args);
        if (bceTrace) {
          addPurpose(bceTrace, {
            type: TracePurpose.Console,
            name
          });
        }
        return result;
      }
    );
  }

  // // make sure, console functions are excluded from dynamic callback patching
  // for (const key of Object.keys(console)) {
  //   // eslint-disable-next-line no-console
  //   if (console[key] instanceof Function) {
  //     monkeyPatchFunctionHolderDefault(console, key);
  //   }
  // }
}
