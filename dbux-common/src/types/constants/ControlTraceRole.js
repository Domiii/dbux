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



const popRoles = new Array(ControlTraceRole.getValueMaxIndex()).map(() => false);
popRoles[ControlTraceRole.Push] = true;
popRoles[ControlTraceRole.PushAndDecision] = true;
export function isTraceControlPop(role) {
  return popRoles[role] || false;
}

export default ControlTraceRole;
