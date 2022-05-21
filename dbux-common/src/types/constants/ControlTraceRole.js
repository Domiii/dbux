import Enum from '../../util/Enum';

const controlTraceRoleObj = {
  Push: 1,
  Decision: 2,
  Pop: 3,
};
/**
 * @type {(Enum|typeof controlTraceRoleObj)}
 */
const ControlTraceRole = new Enum(controlTraceRoleObj);
export default ControlTraceRole;
