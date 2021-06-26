import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import dataNodeCollection from '../data/dataNodeCollection';
import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';


// ###########################################################################
// utility
// ###########################################################################

function getObjectTidOfRef(ref) {
  const { nodeId } = ref;
  // hackfix: this is not the actual `objectTid` of `arr` of the `arr.push` call, but it gets the job done (for now)
  const { traceId: objectTid } = dataNodeCollection.getById(nodeId);
  return objectTid;
}

function wrapIndex(i, arr) {
  if (i >= 0) {
    return i;
  }
  if (i < 0) {
    return arr.length + i;
  }
}

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
        // NOTE: last trace before a function call should be BCE
        const bceTrace = traceCollection.getLast();
        const { traceId: callId } = bceTrace;
        const objectTid = getObjectTidOfRef(ref);

        for (let i = 0; i < args.length; ++i) {
          const varAccess = {
            objectTid,
            prop: arr.length + i
          };
          // console.debug(`[Array.push] #${traceId} ref ${ref.refId}, node ${nodeId}, objectTid ${objectTid}`);
          dataNodeCollection.createDataNode(args[i], callId, DataNodeType.Write, varAccess);

          // NOTE: trace was marked for sending, but will be actually sent with all traces of run, so changes **should** still be possible.
          bceTrace.data = bceTrace.data || {};
          bceTrace.data.monkey = {
            wireInputs: true
          };
        }
      }
    }
  );


  // ###########################################################################
  // slice
  // ###########################################################################

  monkeyPatchMethod(Array, 'slice',
    (arr, [start, end], newArray) => {
      const ref = valueCollection.getRefByValue(arr);
      // if (globalThis.debugArray === arr) {
      //   console.debug('Array.push', ref);
      //   debugger;
      // }
      if (ref) {
        // console.log(`[Array.slice] [${args.map((_, i) => arr.length + i).join(',')}]`);

        // NOTE: last trace before a function call should be BCE
        const bceTrace = traceCollection.getLast();
        const { traceId: callId } = bceTrace;

        // DataNode of newArray
        dataNodeCollection.createOwnDataNode(newArray, callId, DataNodeType.Write);

        const arrTid = getObjectTidOfRef(ref);

        start = !Number.isNaN(start) ? wrapIndex(start, arr) : 0;
        end = !Number.isNaN(end) ? wrapIndex(end, arr) : arr.length - 1;

        // copy operation
        // console.debug('[Array.slice]', start, end);
        for (let i = start; i < end; ++i) {
          const varAccessRead = {
            objectTid: arrTid,
            prop: i
          };
          const readNode = dataNodeCollection.createDataNode(arr[i], callId, DataNodeType.Read, varAccessRead);

          const varAccessWrite = {
            objectTid: callId,
            prop: i
          };
          dataNodeCollection.createWriteNodeFromReadNode(callId, readNode, varAccessWrite);
        }
      }
    }
  );
}
