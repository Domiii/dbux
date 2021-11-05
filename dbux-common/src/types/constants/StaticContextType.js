import Enum from "../../util/Enum";

/**
 * future-work: this and ExecutionContextType are different but don't need to.
 * Consider handling this like we do with `TraceType`: optional dynamic type in `ExecutionContext`
 */

let staticContextTypeObj = {
  Program: 1,
  Function: 2,
  Await: 3,
  Resume: 4
};

/**
 * @type {Enum | typeof staticContextTypeObj}
 */
const StaticContextType = new Enum(staticContextTypeObj);


const interruptableChildTypes = new Array(StaticContextType.getValueMaxIndex()).map((/* _ */) => false);
interruptableChildTypes[StaticContextType.Await] = true;
interruptableChildTypes[StaticContextType.Resume] = true;
export function isVirtualContextType(staticContextType) {
  return interruptableChildTypes[staticContextType];
}

export function isRealContext(staticContextType) {
  return !isVirtualContextType(staticContextType);
}

export default StaticContextType;