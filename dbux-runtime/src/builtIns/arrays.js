import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import SpecialDynamicTraceType from '@dbux/common/src/types/constants/SpecialDynamicTraceType';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import traceCollection from '../data/traceCollection';
import dataNodeCollection, { ShallowValueRefMeta } from '../data/dataNodeCollection';
import { getOrCreateRealArgumentDataNodeIds, peekBCEMatchCallee } from '../data/dataUtil';
import valueCollection from '../data/valueCollection';
import { monkeyPatchFunctionOverride, monkeyPatchHolderOverrideDefault, monkeyPatchMethod, monkeyPatchMethodOverrideDefault, monkeyPatchMethodPurpose } from '../util/monkeyPatchUtil';
import { addPurpose } from './builtin-util';


// ###########################################################################
// utility
// ###########################################################################

function getDataNodeIdFromRef(ref) {
  const { nodeId, _lastNodeId } = ref;
  return _lastNodeId || nodeId;
}

function wrapIndex(i, arr) {
  if (i >= 0) {
    return i;
  }
  else {
    return arr.length + i;
  }
}

const _isNaN = globalThis.isNaN;

function isNaN(x) {
  return x === undefined || _isNaN(x);
}

export default function patchArray() {
  // ###########################################################################
  // push
  // ###########################################################################

  monkeyPatchMethod(Array, 'push',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      // TODO: get real args → see `getCallArgDataNodes`
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace?.data?.argTids) {
        return originalFunction.apply(arr, args);
      }

      const {
        traceId: callId,
        data: {
          argTids,
          spreadLengths
        }
      } = bceTrace;

      const inputNodeIds = getOrCreateRealArgumentDataNodeIds(bceTrace, args);

      const arrNodeId = getDataNodeIdFromRef(ref);

      let idx = arr.length;
      for (let i = 0; i < argTids.length; ++i) {
        // const argTid = argTids[i];
        // const targetTid = argTid || callId;
        const targetTid = callId;
        const spreadLen = spreadLengths[i];

        if (!spreadLen) {
          // default push
          const varAccess = {
            objectNodeId: arrNodeId,
            prop: idx
          };
          // console.debug(`[Array.push] #${traceId} ref ${ref.refId}, node ${nodeId}, arrNodeId ${arrNodeId}`);
          const inputs = [inputNodeIds[i]];
          dataNodeCollection.createDataNode(args[idx], targetTid, DataNodeType.Write, varAccess, inputs);
          idx++;
        }
        else {
          // spread push
          // Add one `DataNode` per spread argument
          for (let j = 0; j < spreadLen; j++) {
            const varAccess = {
              objectNodeId: inputNodeIds[i],
              prop: j
            };
            const readNode = dataNodeCollection.createDataNode(args[i][j], targetTid, DataNodeType.Read, varAccess);

            const varAccessWrite = {
              objectNodeId: arrNodeId,
              prop: idx
            };
            dataNodeCollection.createWriteNodeFromReadNode(targetTid, readNode, varAccessWrite);
            idx++;
          }
        }
      }

      return originalFunction.apply(arr, args);
    }
  );

  // ###########################################################################
  // fill
  // ###########################################################################

  monkeyPatchMethod(Array, 'fill',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;
      const arrNodeId = getDataNodeIdFromRef(ref);
      const allInputs = getOrCreateRealArgumentDataNodeIds(bceTrace, args);
      const writeInputs = [allInputs[0]];

      let [value, start, end] = args;
      start = !isNaN(start) ? wrapIndex(start, arr) : 0;
      end = !isNaN(end) ? wrapIndex(end, arr) : arr.length;

      for (let i = start; i < end; ++i) {
        const varAccess = {
          objectNodeId: arrNodeId,
          prop: i
        };
        dataNodeCollection.createBCEDataNode(value, callId, DataNodeType.Write, varAccess, writeInputs);
      }

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

      addPurpose(bceTrace, {
        type: TracePurpose.NoData,
        name: 'shift'
      });

      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;
      const arrNodeId = getDataNodeIdFromRef(ref);

      // first element gets returned
      const readVarAccess = {
        objectNodeId: arrNodeId,
        prop: 0
      };
      dataNodeCollection.createBCEOwnDataNode(arr[0], callId, DataNodeType.Read, readVarAccess);

      // move up all other elements
      let i;
      for (i = 1; i < arr.length; ++i) {
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

      // last element gets deleted (logically speaking; it actually gets moved to the left)
      const deleteVarAccess = {
        objectNodeId: arrNodeId,
        prop: i - 1
      };
      dataNodeCollection.createDataNode(undefined, callId, DataNodeType.Delete, deleteVarAccess);

      return originalFunction.apply(arr, args);
    }
  );


  // ###########################################################################
  // slice
  // ###########################################################################

  function arrayCopy(srcArr, srcStart, dstStart, len, srcNodeId, dstNodeId, callId) {
    // record all DataNodes of copy operation
    for (let i = 0; i < len; ++i) {
      const iSrc = i + srcStart;
      const iDst = i + dstStart;
      const varAccessRead = {
        objectNodeId: srcNodeId,
        prop: iSrc
      };
      const readNode = dataNodeCollection.createDataNode(srcArr[iSrc], callId, DataNodeType.Read, varAccessRead);

      const varAccessWrite = {
        objectNodeId: dstNodeId,
        prop: iDst
      };
      dataNodeCollection.createWriteNodeFromReadNode(callId, readNode, varAccessWrite);
    }
  }

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
      const arrNodeId = getDataNodeIdFromRef(ref);

      // let BCE hold DataNode of newArray
      // DataNodeType.Create
      const newArrayNode = dataNodeCollection.createBCEOwnDataNode(newArray, callId, DataNodeType.Compute, null, null, ShallowValueRefMeta);

      // console.log(`SLICE ${start}:${end} ${!isNaN(start)}`);
      // console.log(`SLICE BCE-owned DataNode #${bceTrace.nodeId} - ${JSON.stringify(bceTrace)} (${JSON.stringify(newArrayNode)})`);

      start = !isNaN(start) ? wrapIndex(start, arr) : 0;
      end = !isNaN(end) ? wrapIndex(end, arr) : arr.length;

      arrayCopy(arr, start, 0, end - start, arrNodeId, newArrayNode.nodeId, callId);

      addPurpose(bceTrace, {
        type: TracePurpose.CalleeObjectInput
      });

      return newArray;
    }
  );

  // ###########################################################################
  // pop
  // ###########################################################################

  monkeyPatchMethod(Array, 'pop',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;
      const arrNodeId = getDataNodeIdFromRef(ref);

      // delete and return last
      const i = arr.length - 1;
      const varAccess = {
        objectNodeId: arrNodeId,
        prop: i
      };
      dataNodeCollection.createBCEOwnDataNode(arr[i], callId, DataNodeType.ReadAndDelete, varAccess);

      return originalFunction.apply(arr, args);
    }
  );

  /** ###########################################################################
   * concat
   * ##########################################################################*/

  function _concatAddArrayOrValue(arr, val, arrIdx, srcNodeId, dstNodeId, targetTid) {
    if (Array.isArray(val)) {
      arrayCopy(val, 0, arrIdx, val.length, srcNodeId, dstNodeId, targetTid);
      return arrIdx + val.length;
    }
    else {
      const varAccess = {
        objectNodeId: dstNodeId,
        prop: arrIdx
      };
      const inputs = [srcNodeId];
      dataNodeCollection.createBCEDataNode(val, targetTid, DataNodeType.Write, varAccess, inputs);
      return arrIdx + 1;
    }
  }

  monkeyPatchMethod(Array, 'concat',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);

      if (!bceTrace?.data?.argTids) {
        return originalFunction.apply(arr, args);
      }

      // 1. concat everything
      const resultArr = originalFunction.apply(arr, args);

      const {
        traceId: callId,
        data: {
          argTids,
          spreadLengths
        }
      } = bceTrace;

      const inputNodeIds = getOrCreateRealArgumentDataNodeIds(bceTrace, args);

      const origArrNodeId = getDataNodeIdFromRef(ref);

      // 2. copy input array
      const newArrayNode = dataNodeCollection.createBCEOwnDataNode(resultArr, callId, DataNodeType.Compute, null, null, ShallowValueRefMeta);
      arrayCopy(arr, 0, 0, arr.length, origArrNodeId, newArrayNode.nodeId, callId);

      // console.log(`concat arrNodeId=${arrNodeId}`);

      let argIdx = 0;
      let arrIdx = arr.length;
      for (let i = 0; i < argTids.length; ++i) {
        // const argTid = argTids[i];
        // const targetTid = argTid || callId;
        const targetTid = callId;
        const spreadLen = spreadLengths[i];

        if (!spreadLen) {
          // default concat
          // console.debug(`[Array.push] #${traceId} ref ${ref.refId}, node ${nodeId}, arrNodeId ${arrNodeId}`);
          const srcNodeId = inputNodeIds[i];

          // dataNodeCollection.createBCEDataNode(args[idx], targetTid, DataNodeType.Write, varAccessWrite, inputs);
          arrIdx = _concatAddArrayOrValue(arr, args[argIdx], arrIdx, srcNodeId, newArrayNode.nodeId, targetTid);
          ++argIdx;
        }
        else {
          // spread concat
          // Add one `DataNode` per spread argument
          for (let j = 0; j < spreadLen; j++) {
            const varAccessRead = {
              objectNodeId: inputNodeIds[i],
              prop: j
            };
            const readNode = dataNodeCollection.createBCEDataNode(args[argIdx], targetTid, DataNodeType.Read, varAccessRead);
            const srcNodeId = readNode.nodeId;

            arrIdx = _concatAddArrayOrValue(arr, args[argIdx], arrIdx, srcNodeId, newArrayNode.nodeId, targetTid);
            ++argIdx;
            // dataNodeCollection.createWriteNodeFromReadNode(targetTid, readNode, varAccessWrite);
          }
        }
      }

      return resultArr;
    }
  );

  // // ###########################################################################
  // // indexOf
  // // NOTE: indexOf does not work like this. It only induces "index control dependencies", not data movement dependencies.
  // // ###########################################################################

  // monkeyPatchMethod(Array, 'indexOf',
  //   (arr, args, originalFunction, patchedFunction) => {
  //     const ref = valueCollection.getRefByValue(arr);
  //     const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
  //     if (!bceTrace) {
  //       return originalFunction.apply(arr, args);
  //     }

  //     const allInputs = getOrCreateRealArgumentDataNodeIds(bceTrace, args);
  //     const resultIdx = originalFunction.apply(arr, args);

  //     const { traceId: callId } = bceTrace;
  //     const arrNodeId = getDataNodeIdFromRef(ref);

  //     if (resultIdx > -1) {
  //       // NOTE: there is no read here
  //     }

  //     return resultIdx;
  //   }
  // );

  /** ###########################################################################
   * built-in HOFs
   * ##########################################################################*/

  /**
   * These HOFs are called with a callback function, which will be called
   * once per array entry.
   */
  [
    "forEach",
    "filter",
    "map",
    "every",
    "some",
    "findIndex",
    "flatMap"
  ].forEach((m) => {
    monkeyPatchMethod(Array, m,
      (arr, args, originalFunction, patchedFunction) => {
        // let [cb] = args;
        const ref = valueCollection.getRefByValue(arr);
        const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
        if (bceTrace) {
          const { traceId: callId } = bceTrace;

          // [edit-after-send]
          bceTrace.data = bceTrace.data || {};
          bceTrace.data.specialDynamicType = SpecialDynamicTraceType.ArrayHofCall;

          const arrNodeId = getDataNodeIdFromRef(ref);

          // record all DataNodes of copy operation
          for (let i = 0; i < arr.length; ++i) {
            const varAccessRead = {
              objectNodeId: arrNodeId,
              prop: i
            };

            // add new DataNodes to BCE
            /* const readNode = */
            dataNodeCollection.createDataNode(arr[i], callId, DataNodeType.Read, varAccessRead);
          }
        }
        const result = originalFunction.apply(arr, args);
        return result;
      }
    );
  });


  const defaultComputeMethods = [
    "toLocaleString",
    "toString",
    // "indexOf",
    // "lastIndexOf"
  ];
  defaultComputeMethods.forEach(f => {
    monkeyPatchMethodPurpose(Array, f, {
      type: TracePurpose.ComputeWithThis,
      name: f
    });
  });

  /** ###########################################################################
   * TODO: other (make non-patchable for now)
   * ###########################################################################*/

  [
    "reduce",
    "reduceRight"
  ].forEach((m) => {
    // TODO
    monkeyPatchMethodPurpose(Array, m, {
      type: TracePurpose.NoData,
      name: m
    });
    // monkeyPatchMethodOverrideDefault(Array, m);
  });

  // var ign = new Set(['constructor', 'at']);
  // copy(Object.getOwnPropertyNames(Array.prototype).filter(f => Array.prototype[f] instanceof Function && 
  //  !ign.has(f)))
  [
    "copyWithin",
    "reverse",
    "unshift",
    "sort",
    "splice",
    "includes",
    "join",
    "keys",
    "entries",
    "values",
    "flat",
  // ].forEach(m => monkeyPatchMethodOverrideDefault(Array, m));
  ].forEach(m => {
    monkeyPatchMethodPurpose(Array, m, {
      type: TracePurpose.NoData,
      name: m
    });
  });
}

[
  'isArray',
].forEach(m => monkeyPatchHolderOverrideDefault(Array, m));
