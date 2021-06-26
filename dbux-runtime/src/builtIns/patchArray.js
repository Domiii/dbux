import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import dataNodeCollection from '../data/dataNodeCollection';
import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';

export default function patchArray(rm) {
  // ###########################################################################
  // push
  // ###########################################################################

  monkeyPatchMethod(Array, 'push', null,
    (arr, args) => {
      const ref = valueCollection.getRefByValue(arr);
      // if (globalThis.debugArray === arr) {
      //   console.debug('Array.push', ref);
      //   debugger;
      // }
      if (ref) {
        // console.log(`pushing indexes [${args.map((_, i) => arr.length + i).join(',')}]`);
        for (let i = 0; i < args.length; ++i) {
          // NOTE: last trace before a function call should be BCE
          const bceTrace = traceCollection.getLast();
          const { traceId } = bceTrace;

          // hackfix: this is not the actual `objectTid` of `arr` of the `arr.push` call, but it gets the job done (for now)
          const { nodeId } = ref;
          const { traceId: objectTid } = dataNodeCollection.getById(nodeId);

          const varAccess = {
            objectTid,
            prop: arr.length + i
          };
          // console.debug(`[Array.push] #${traceId} ref ${ref.refId}, node ${nodeId}, objectTid ${objectTid}`);
          dataNodeCollection.createOwnDataNode(args[i], traceId, DataNodeType.Write, varAccess);

          // NOTE: trace was marked for sending, but will be actually sent with all traces of run, so changes **should** still be possible.
          bceTrace.data = bceTrace.data || {};
          bceTrace.data.monkey = {
            wireInputs: true
          };
        }
      }
    }
  );
}
