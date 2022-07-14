import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import dataNodeCollection from '../data/dataNodeCollection';
import { getOrCreateRealArgumentDataNodeIds, peekBCEMatchCallee } from '../data/dataUtil';
import valueCollection from '../data/valueCollection';
import { monkeyPatchMethod, monkeyPatchMethodOverrideDefault } from '../util/monkeyPatchUtil';
import { makeKey } from './builtin-util';

// ###########################################################################
// utility
// ###########################################################################

function getDataNodeIdFromRef(ref) {
  const { nodeId } = ref;
  return nodeId;
}


// ###########################################################################
// get
// ###########################################################################

function patchGet(holder) {
  monkeyPatchMethod(holder, 'get',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;
      
      const result = originalFunction.apply(arr, args);
      
      const objectNodeId = getDataNodeIdFromRef(ref);
      const key = makeKey(args[0]);
      const varAccess = {
        objectNodeId,
        prop: key
      };
      dataNodeCollection.createBCEOwnDataNode(result, callId, DataNodeType.Read, varAccess);

      return result;
    }
  );
}

// ###########################################################################
// set
// ###########################################################################

function patchMapSet(holder) {
  monkeyPatchMethod(holder, 'set',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;

      const objectNodeId = getDataNodeIdFromRef(ref);
      const key = makeKey(args[0]);
      const varAccess = {
        objectNodeId,
        prop: key
      };
      const inputs = getOrCreateRealArgumentDataNodeIds(bceTrace, args).slice(1);
      dataNodeCollection.createBCEDataNode(args[1], callId, DataNodeType.Write, varAccess, inputs);

      return originalFunction.apply(arr, args);
    }
  );
}

// ###########################################################################
// add
// ###########################################################################

function patchSetAdd(holder) {
  monkeyPatchMethod(holder, 'add',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;

      const objectNodeId = getDataNodeIdFromRef(ref);
      const key = makeKey(args[0]);
      const varAccess = {
        objectNodeId,
        prop: key
      };
      const inputs = getOrCreateRealArgumentDataNodeIds(bceTrace, args);
      dataNodeCollection.createBCEDataNode(args[0], callId, DataNodeType.Write, varAccess, inputs);

      return originalFunction.apply(arr, args);
    }
  );
}

// ###########################################################################
// delete
// ###########################################################################

function patchDelete(holder) {
  monkeyPatchMethod(holder, 'delete',
    (arr, args, originalFunction, patchedFunction) => {
      const ref = valueCollection.getRefByValue(arr);
      const bceTrace = ref && peekBCEMatchCallee(patchedFunction);
      if (!bceTrace) {
        return originalFunction.apply(arr, args);
      }

      const { traceId: callId } = bceTrace;

      const objectNodeId = getDataNodeIdFromRef(ref);
      const key = makeKey(args[0]);
      const varAccess = {
        objectNodeId,
        prop: key
      };
      dataNodeCollection.createBCEDataNode(undefined, callId, DataNodeType.Delete, varAccess);

      return originalFunction.apply(arr, args);
    }
  );
}

export default function patchMapAndSet() {
  patchGet(Map);
  patchMapSet(Map);
  patchDelete(Map);

  patchSetAdd(Set);
  patchDelete(Set);

  // patchGet(WeakMap);
  // patchMapSet(WeakMap);
  // patchDelete(WeakMap);

  // patchSetAdd(WeakSet);
  // patchDelete(WeakSet);
  

  [
    'has', // TODO: add control reads (`cinputs`)
    'forEach'
  ].forEach(m => monkeyPatchMethodOverrideDefault(Map, m));

  // [
  //   'has'
  // ].forEach(m => monkeyPatchMethodOverrideDefault(WeakMap, m));
}

