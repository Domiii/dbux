import Enum from '../../util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let ExecutionContextType = {
  Immediate: 1,
  ExecuteCallback: 2,
  Await: 3,
  ResumeAsync: 4,
  ResumeGen: 5
};

// NOTE: we cannot use `const` in a single assignment here, because that way, type members would not be recognized.
ExecutionContextType = new Enum(ExecutionContextType);


const virtualTypes = new Array(ExecutionContextType.getValueMaxIndex()).map((/* _ */) => false);
virtualTypes[ExecutionContextType.Await] = true;
virtualTypes[ExecutionContextType.ResumeAsync] = true;
virtualTypes[ExecutionContextType.ResumeGen] = true;
export function isVirtualContextType(executionContextType) {
  return virtualTypes[executionContextType];
}

const resumeTypes = new Array(ExecutionContextType.getValueMaxIndex()).map((/* _ */) => false);
resumeTypes[ExecutionContextType.ResumeAsync] = true;
resumeTypes[ExecutionContextType.ResumeGen] = true;
export function isResumeType(executionContextType) {
  return resumeTypes[executionContextType];
}

export function isRealContextType(executionContextType) {
  return !isVirtualContextType(executionContextType);
}

export default ExecutionContextType;