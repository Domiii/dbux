// import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import SpecialCallType from '@dbux/common/src/types/constants/SpecialCallType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import dataNodeCollection from '../data/dataNodeCollection';
import { getTraceOwnDataNode, peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';
import { doApply, originalBind } from './originals';

/** @typedef {import('../RuntimeMonitor').default} RuntimeMonitor */


function getCalledFunctionTid(bceTrace) {
  // get actual function actualFunctionDataNode
  const { /* traceId: callId, */ data: { calleeTid } } = bceTrace;
  const calleeDataNode = getTraceOwnDataNode(calleeTid); // stored in {@link RuntimeMonitor#traceExpressionME}
  const { objectNodeId } = calleeDataNode?.varAccess || EmptyObject;
  const actualFunctionDataNode = objectNodeId && dataNodeCollection.getById(objectNodeId);
  return actualFunctionDataNode?.traceId || 0;
}

function setCalledFunctionTid(bceTrace, specialCallType) {
  // [edit-after-send]
  bceTrace.data.calledFunctionTid = getCalledFunctionTid(bceTrace);
  bceTrace.data.specialCallType = specialCallType;
}

/**
 * @param {RuntimeMonitor} runtimeMonitor
 */
export default function patchFunction(runtimeMonitor) {
  // ###########################################################################
  // call
  // ###########################################################################

  monkeyPatchMethod(Function, 'call',
    (actualFunction, args, originalCall, patchedCall) => {
      const bceTrace = peekBCEMatchCallee(patchedCall);
      let argTids;
      if (bceTrace?.data) {
        setCalledFunctionTid(bceTrace, SpecialCallType.Call);
        argTids = bceTrace.data.argTids;
      }
      else {
        argTids = EmptyArray;
      }

      const callId = bceTrace?.traceId || 0;
      if (callId) {
        runtimeMonitor.callbackPatcher.monkeyPatchArgs(actualFunction, callId, args, EmptyArray, argTids);
      }

      return originalCall.bind(actualFunction)(...args);
    }
  );

  // ###########################################################################
  // apply
  // ###########################################################################

  monkeyPatchMethod(Function, 'apply',
    (actualFunction, applyArgs, originalApply, patchedApply) => {
      const bceTrace = peekBCEMatchCallee(patchedApply);
      let argTids;
      if (bceTrace?.data) {
        setCalledFunctionTid(bceTrace, SpecialCallType.Apply);
        argTids = bceTrace.data.argTids;
      }
      else {
        argTids = EmptyArray;
      }

      const args = applyArgs[1];
      const callId = bceTrace?.traceId || 0;
      
      if (Array.isArray(args) && callId) {
        runtimeMonitor.callbackPatcher.monkeyPatchArgs(actualFunction, callId, args, EmptyArray, argTids);
      }

      return originalApply.bind(actualFunction)(...applyArgs);
    }
  );

  // ###########################################################################
  // bind
  // ###########################################################################

  monkeyPatchMethod(Function, 'bind',
    (actualFunction, args, __originalBind, patchedBind) => {
      const bceTrace = peekBCEMatchCallee(patchedBind);
      if (bceTrace?.data) {
        setCalledFunctionTid(bceTrace, SpecialCallType.Bind);
      }

      const result = originalBind.bind(actualFunction)(...args);
      return result;
    }
  );
}
