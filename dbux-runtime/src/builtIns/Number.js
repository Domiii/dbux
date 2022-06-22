import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import { peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchFunctionHolder, monkeyPatchFunctionHolderPurpose, monkeyPatchMethod } from '../util/monkeyPatchUtil';
import { addPurpose } from './builtin-util';


export default function patchNumber() {
  const defaultComputeFunctions = [
    "isFinite",
    "isInteger",
    "isNaN",
    "isSafeInteger",
    "parseFloat",
    "parseInt",
  ];

  const defaultComputeMethods = [
    'toFixed',
    'toPrecision',
    'valueOf',
  ];

  defaultComputeFunctions.forEach(f => {
    monkeyPatchFunctionHolder(Number, f,
      // eslint-disable-next-line no-loop-func
      (arr, args, originalFunction, patchedFunction) => {
        const bceTrace = peekBCEMatchCallee(patchedFunction);
        const result = originalFunction.apply(arr, args);
        if (bceTrace) {
          addPurpose(bceTrace, {
            type: TracePurpose.Compute,
            name: f
          });
        }
        return result;
      }
    );
  });

  defaultComputeMethods.forEach(f => {
    monkeyPatchMethod(Number, f,
      // eslint-disable-next-line no-loop-func
      (arr, args, originalFunction, patchedFunction) => {
        const bceTrace = peekBCEMatchCallee(patchedFunction);
        const result = originalFunction.apply(arr, args);
        if (bceTrace) {
          addPurpose(bceTrace, {
            type: TracePurpose.Compute,
            name: f
          });
        }
        return result;
      }
    );
  });
}