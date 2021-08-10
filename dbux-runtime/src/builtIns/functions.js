import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import dataNodeCollection from '../data/dataNodeCollection';
import { isInstrumentedFunction, peekBCEMatchCallee } from '../data/dataUtil';
import valueCollection from '../data/valueCollection';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';


export default function patchFunction() {
  // ###########################################################################
  // call
  // ###########################################################################

  // monkeyPatchMethod(Function, 'call',
  //   (thisArg, args, originalFunction, patchedFunction) => {
  //     // TODO: get function on which `call` was called -> requires instrumentation?

  //     // if (isInstrumentedFunction(originalFunction)) 
  //     {
  //       const bceTrace = peekBCEMatchCallee(patchedFunction);
  //       if (!bceTrace) {
  //         return originalFunction.apply(arr, args);
  //       }

  //       const { traceId: callId } = bceTrace;
  //       const objectNodeId = getObjectNodeIdFromRef(ref);

  //       for (let i = 0; i < args.length; ++i) {
  //         const varAccess = {
  //           objectNodeId,
  //           prop: arr.length + i
  //         };
  //         // console.debug(`[Array.push] #${traceId} ref ${ref.refId}, node ${nodeId}, objectNodeId ${objectNodeId}`);
  //         dataNodeCollection.createDataNode(args[i], callId, DataNodeType.Write, varAccess);

  //         // NOTE: trace was marked for sending, but will be actually sent with all traces of run, so changes **should** still be possible.
  //         bceTrace.data = bceTrace.data || {};
  //         bceTrace.data.monkey = {
  //           wireInputs: true
  //         };
  //       }
  //       return originalFunction.apply(arr, args);
  //     }
  //   }
  // );
}
