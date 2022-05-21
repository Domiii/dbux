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



const pushRoles = new Array(ControlTraceRole.getValueMaxIndex()).map(() => false);
pushRoles[ControlTraceRole.Push] = true;
pushRoles[ControlTraceRole.PushAndDecision] = true;
export function isTraceRoleControlPush(role) {
  return pushRoles[role] || false;
}

const popRoles = new Array(ControlTraceRole.getValueMaxIndex()).map(() => false);
popRoles[ControlTraceRole.Pop] = true;
export function isTraceRoleControlPop(role) {
  return popRoles[role] || false;
}

export default ControlTraceRole;
