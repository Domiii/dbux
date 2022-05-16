import Enum from "../../util/Enum";

/**
 * future-work: this and ExecutionContextType are different but don't need to.
 * Consider handling this like we do with `TraceType`: optional dynamic type in `ExecutionContext`
 */

let staticContextTypeObj = {
  Program: 1,
  Function: 2,
  Await: 3,
  ResumeAsync: 4,
  ResumeGen: 5,
  ResumeAsyncGen: 6,
};

/**
 * @type {(Enum | typeof staticContextTypeObj)}
 */
const StaticContextType = new Enum(staticContextTypeObj);


const interruptableChildTypes = new Array(StaticContextType.getValueMaxIndex()).map((/* _ */) => false);
interruptableChildTypes[StaticContextType.Await] = true;
interruptableChildTypes[StaticContextType.ResumeAsync] = true;
interruptableChildTypes[StaticContextType.ResumeGen] = true;
interruptableChildTypes[StaticContextType.ResumeAsyncGen] = true;
export function isVirtualStaticContextType(staticContextType) {
  return interruptableChildTypes[staticContextType];
}

export function isRealStaticContext(staticContextType) {
  return !isVirtualStaticContextType(staticContextType);
}

const asyncResumeTypes = new Array(StaticContextType.getValueMaxIndex()).map((/* _ */) => false);
asyncResumeTypes[StaticContextType.ResumeAsync] = true;
asyncResumeTypes[StaticContextType.ResumeAsyncGen] = true;
export function isAsyncResumeType(staticContextType) {
  return asyncResumeTypes[staticContextType];
}

export default StaticContextType;