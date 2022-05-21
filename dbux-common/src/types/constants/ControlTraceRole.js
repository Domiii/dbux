import Enum from '../../util/Enum';

const controlTraceRoleObj = {
  Push: 1,
  Decision: 2,
  PushAndDecision: 3,
  Pop: 4,
};
/**
 * @type {(Enum|typeof controlTraceRoleObj)}
 */
const ControlTraceRole = new Enum(controlTraceRoleObj);
export default ControlTraceRole;
