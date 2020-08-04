import Enum from '../../util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let ExecutionContextType = {
  Immediate: 1,
  ExecuteCallback: 2,
  Await: 3,
  Resume: 4
};

// NOTE: we cannot use `const` in a single assignment here, because that way, type members would not be recognized.
ExecutionContextType = new Enum(ExecutionContextType);


const interruptableChildTypes = new Array(ExecutionContextType.getValueMaxIndex()).map((/* _ */) => false);
interruptableChildTypes[ExecutionContextType.Await] = true;
interruptableChildTypes[ExecutionContextType.Resume] = true;
export function isVirtualContextType(executionContextType) {
  return interruptableChildTypes[executionContextType];
}

export function isRealContextType(executionContextType) {
  return !isVirtualContextType(executionContextType);
}

export default ExecutionContextType;