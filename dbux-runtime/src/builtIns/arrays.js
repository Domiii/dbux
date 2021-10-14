import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import traceCollection from '../data/traceCollection';
import dataNodeCollection from '../data/dataNodeCollection';
import { peekBCEMatchCallee } from '../data/dataUtil';
import valueCollection from '../data/valueCollection';
import { monkeyPatchFunctionOverride, monkeyPatchHolderOverrideDefault, monkeyPatchMethod, monkeyPatchMethodOverrideDefault } from '../util/monkeyPatchUtil';


// ###########################################################################
// utility
// ###########################################################################

function getNodeIdFromRef(ref) {
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

export default function patchArray() {
  // ###########################################################################
  // push
  // ###########################################################################

  monkeyPatchMethod(Array, 'push',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace?.data?.argTids) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId, data: { argTids } } = bceTrace;
      const arrNodeId = getNodeIdFromRef(ref);

      for (let i = 0; i < args.length; ++i) {
        const varAccess = {
          objectNodeId: arrNodeId,
          prop: arr.length + i
        };
        // console.debug(`[Array.push] #${traceId} ref ${ref.refId}, node ${nodeId}, arrNodeId ${arrNodeId}`);
        const argTid = argTids[i];
        const inputs = [traceCollection.getOwnDataNodeIdByTraceId(argTid)];
        dataNodeCollection.createDataNode(args[i], callId, DataNodeType.Write, varAccess, inputs);
      }

      // [edit-after-send]
      bceTrace.data = bceTrace.data || {};
      bceTrace.data.monkey = {
        wireInputs: true
      };

      return originalFunction.apply(arr, args);
    }
  );

  // ###########################################################################
  // shift
  // ###########################################################################

  monkeyPatchMethod(Array, 'shift',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;
      const arrNodeId = getNodeIdFromRef(ref);

      // delete first
      const shiftVarAccess = {
        objectNodeId: arrNodeId,
        prop: 0
      };
      dataNodeCollection.createOwnDataNode(undefined, callId, DataNodeType.Delete, shiftVarAccess);

      // move up all other elements
      for (let i = 1; i < arr.length; ++i) {
        const varAccessRead = {
          objectNodeId: arrNodeId,
          prop: i
        };
        const readNode = dataNodeCollection.createDataNode(arr[i], callId, DataNodeType.Read, varAccessRead);

        const varAccessWrite = {
          objectNodeId: arrNodeId,
          prop: i - 1
        };
        dataNodeCollection.createWriteNodeFromReadNode(callId, readNode, varAccessWrite);
      }

      // [edit-after-send]
      bceTrace.data = bceTrace.data || {};
      bceTrace.data.monkey = {
        wireInputs: true
      };

      return originalFunction.apply(arr, args);
    }
  );


  // ###########################################################################
  // slice
  // ###########################################################################

  monkeyPatchMethod(Array, 'slice',
    (arr, args, originalFunction, patchedFunction) => {
      let [start, end] = args;
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      const newArray = originalFunction.apply(arr, args);
      if (!bceTrace) {
        return newArray;
      }

      const { traceId: callId } = bceTrace;
      const arrNodeId = getNodeIdFromRef(ref);

      // let BCE hold DataNode of newArray
      // DataNodeType.Create
      const newArrayNode = dataNodeCollection.createBCEOwnDataNode(newArray, callId, DataNodeType.Write);

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
          prop: i - start
        };
        dataNodeCollection.createWriteNodeFromReadNode(callId, readNode, varAccessWrite);
      }
      return newArray;
    }
  );

  /** ###########################################################################
   * other (make non-patchable for now)
   * ###########################################################################*/

  // var ign = new Set(['constructor', 'at']);
  // copy(Object.getOwnPropertyNames(Array.prototype).filter(f => Array.prototype[f] instanceof Function && 
  //  !ign.has(f)))
  [
    "concat",
    "copyWithin",
    "fill",
    "find",
    "findIndex",
    "lastIndexOf",
    "pop",
    "reverse",
    "unshift",
    "sort",
    "splice",
    "includes",
    "indexOf",
    "join",
    "keys",
    "entries",
    "values",
    "forEach",
    "filter",
    "flat",
    "flatMap",
    "map",
    "every",
    "some",
    "reduce",
    "reduceRight",
    "toLocaleString",
    "toString"
  ].forEach(key => monkeyPatchMethodOverrideDefault(Array, key));
}

[
  'isArray',
].forEach(key => monkeyPatchHolderOverrideDefault(Array, key));
