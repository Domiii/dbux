import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import dataNodeCollection from '../data/dataNodeCollection';
import { getTraceOwnDataNode, peekBCEMatchCallee } from '../data/dataUtil';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';


// var c = Function.prototype.call;
// function f(a, b) { console.log(this, a, b); }
// Function.prototype.call = function (...args) {
//   console.log('call', this, args);
//   return c.bind(this)(...args);
// }
// f.call(1, 2, 3);

export default function patchFunction() {
  // ###########################################################################
  // call
  // ###########################################################################

  monkeyPatchMethod(Function, 'call',
    (actualFunction, args, originalCall, patchedCall) => {
      // console.debug(`Function.prototype.call`, actualFunction);
      // const bceTrace = peekBCEMatchCallee(patchedCall);
      // if (bceTrace?.data) {
      //   // get actual function actualFunctionDataNode
      //   const { traceId: callId, data: { calleeTid } } = bceTrace;
      //   const calleeDataNode = getTraceOwnDataNode(calleeTid); // stored in {@link RuntimeMonitor#traceExpressionME}
      //   const { objectNodeId } = calleeDataNode?.varAccess || EmptyObject;
      //   const actualFunctionDataNode = objectNodeId && dataNodeCollection.getById(objectNodeId);
        
      //   if (actualFunctionDataNode) {
      //     // [edit-after-send]
      //     bceTrace.data.calledFunctionTid = actualFunctionDataNode.traceId;
          
      //     for (let i = 0; i < args.length; ++i) {
      //       const varAccess = {
      //         objectNodeId,
      //         prop: arr.length + i
      //       };
      //       dataNodeCollection.createDataNode(args[i], callId, DataNodeType.Write, varAccess);

      //     }
      //   }
      // }
      return originalCall.bind(actualFunction)(...args);
    }
  );

  // ###########################################################################
  // apply
  // ###########################################################################

  monkeyPatchMethod(Function, 'apply',
    (actualFunction, args, originalCall, patchedCall) => {
      return originalCall.bind(actualFunction)(...args);
    }
  );
}
