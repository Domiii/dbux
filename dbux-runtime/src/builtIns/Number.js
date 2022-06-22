import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import { peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchFunctionHolder, monkeyPatchFunctionHolderPurpose, monkeyPatchMethod, monkeyPatchMethodPurpose, registerMonkeyPatchedProxy } from '../util/monkeyPatchUtil';
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
    monkeyPatchFunctionHolderPurpose(Number, f, {
      type: TracePurpose.Compute,
      name: f
    });
  });

  defaultComputeMethods.forEach(f => {
    monkeyPatchMethodPurpose(Number, f, {
      type: TracePurpose.ComputeWithThis,
      name: f
    });
  });

  // override Number ctor
  const ctorHandler = (args, result) => {
    const bceTrace = peekBCEMatchCallee(Number);
    if (bceTrace) {
      addPurpose(bceTrace, {
        type: TracePurpose.Compute,
        name: 'Number'
      });
    }
    return result;
  };
  const p = new Proxy(Number, {
    apply(target, thisArg, args) {
      const result = Reflect.apply(target, thisArg, args);
      return ctorHandler(args, result);
    },
    construct(target, args) {
      const result = Reflect.construct(target, args);
      return ctorHandler(args, result);
    }
  });
  registerMonkeyPatchedProxy(Number, p);
}