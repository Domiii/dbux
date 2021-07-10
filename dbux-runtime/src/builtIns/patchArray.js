import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import dataNodeCollection from '../data/dataNodeCollection';
import { peekBCECheckCallee, peekBCEMatchCallee } from '../data/dataUtil';
import valueCollection from '../data/valueCollection';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';


// ###########################################################################
// utility
// ###########################################################################

function getObjectNodeIdFromRef(ref) {
  const { nodeId } = ref;
  return nodeId;
}

function wrapIndex(i, arr) {
  if (i >= 0) {
    return i;
  }
  else {
    return arr.length + i;
  }
}

export default function patchArray(rm) {
  // ###########################################################################
  // push
  // ###########################################################################

  monkeyPatchMethod(Array, 'push', null,
    (arr, args, actualCallee) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(actualCallee);
      if (!bceTrace) { return; }

      const { traceId: callId } = bceTrace;
      const objectNodeId = getObjectNodeIdFromRef(ref);

      for (let i = 0; i < args.length; ++i) {
        const varAccess = {
          objectNodeId,
          prop: arr.length + i
        };
        // console.debug(`[Array.push] #${traceId} ref ${ref.refId}, node ${nodeId}, objectNodeId ${objectNodeId}`);
        dataNodeCollection.createDataNode(args[i], callId, DataNodeType.Write, varAccess);

        // NOTE: trace was marked for sending, but will be actually sent with all traces of run, so changes **should** still be possible.
        bceTrace.data = bceTrace.data || {};
        bceTrace.data.monkey = {
          wireInputs: true
        };
      }
    }
  );


  // ###########################################################################
  // slice
  // ###########################################################################

  monkeyPatchMethod(Array, 'slice',
    (arr, [start, end], newArray, actualCallee) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(actualCallee);
      if (!bceTrace) { return; }

      const { traceId: callId } = bceTrace;
      const arrNodeId = getObjectNodeIdFromRef(ref);

      // let BCE hold DataNode of newArray
      const newArrayNode = dataNodeCollection.createOwnDataNode(newArray, callId, DataNodeType.Write);

      start = !Number.isNaN(start) ? wrapIndex(start, arr) : 0;
      end = !Number.isNaN(end) ? wrapIndex(end, arr) : arr.length - 1;

      // record all DataNodes of copy operation
      for (let i = start; i < end; ++i) {
        const varAccessRead = {
          objectNodeId: arrNodeId,
          prop: i
        };
        const readNode = dataNodeCollection.createDataNode(arr[i], callId, DataNodeType.Read, varAccessRead);

        const varAccessWrite = {
          objectNodeId: newArrayNode.nodeId,
          prop: i
        };
        dataNodeCollection.createWriteNodeFromReadNode(callId, readNode, varAccessWrite);
      }
    }
  );
}
