import Enum from '../../util/Enum';


let ExecutionContextType = {
  Immediate: 1,
  ExecuteCallback: 2,
  Await: 3,
  Resume: 4
};

// NOTE: we cannot use `const` in a single assignment here, because that way, type members would not be recognized.
ExecutionContextType = new Enum(ExecutionContextType);


const interruptableChildTypes = new Array(ExecutionContextType.getCount()).map(_ => false);
interruptableChildTypes[ExecutionContextType.Await] = true;
interruptableChildTypes[ExecutionContextType.Resume] = true;
export function isVirtualContextType(staticContextType) {
  return interruptableChildTypes[staticContextType];
}

export function isRealContext(staticContextType) {
  return !isVirtualContextType(staticContextType);
}

export default ExecutionContextType;