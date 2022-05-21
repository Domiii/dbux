import Enum from '../../util/Enum';

const traceControlRoleObj = {
  Push: 1,
  Decision: 2,
  PushAndDecision: 3,
  Pop: 4,
};

/**
 * @type {(Enum|typeof traceControlRoleObj)}
 */
const TraceControlRole = new Enum(traceControlRoleObj);



const pushRoles = new Array(TraceControlRole.getValueMaxIndex()).map(() => false);
pushRoles[TraceControlRole.Push] = true;
pushRoles[TraceControlRole.PushAndDecision] = true;
export function isTraceControlRolePush(role) {
  return pushRoles[role] || false;
}

const popRoles = new Array(TraceControlRole.getValueMaxIndex()).map(() => false);
popRoles[TraceControlRole.Pop] = true;
export function isTraceControlRolePop(role) {
  return popRoles[role] || false;
}

const decisionRoles = new Array(TraceControlRole.getValueMaxIndex()).map(() => false);
decisionRoles[TraceControlRole.Decision] = true;
decisionRoles[TraceControlRole.PushAndDecision] = true;
export function isTraceControlRoleDecision(role) {
  return decisionRoles[role] || false;
}

export default TraceControlRole;
