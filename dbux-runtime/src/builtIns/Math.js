import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import { peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchFunctionHolder } from '../util/monkeyPatchUtil';
import { addPurpose } from './builtin-util';


export default function patchMath() {
  const defaultComputeFunctions = [
    "abs",
    "acos",
    "acosh",
    "asin",
    "asinh",
    "atan",
    "atan2",
    "atanh",
    "cbrt",
    "ceil",
    "clz32",
    "cos",
    "cosh",
    "exp",
    "expm1",
    "floor",
    "fround",
    "hypot",
    "imul",
    "log",
    "log10",
    "log1p",
    "log2",
    "pow",
    "random",
    "round",
    "sign",
    "sin",
    "sinh",
    "sqrt",
    "tan",
    "tanh",
    "trunc"
  ];

  defaultComputeFunctions.forEach(f => {
    monkeyPatchFunctionHolder(Math, f,
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

  // TODO:
  // "max",
  // "min",
}