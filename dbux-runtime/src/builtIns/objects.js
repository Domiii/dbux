import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import dataNodeCollection from '../data/dataNodeCollection';
import { getOrCreateRealArgumentDataNodeIds, peekBCEMatchCallee } from '../data/dataUtil';
import valueCollection from '../data/valueCollection';
import { monkeyPatchFunctionHolder, monkeyPatchHolderOverrideDefault } from '../util/monkeyPatchUtil';

const ObjectEntries = Object.entries;

export default function patchObject() {
  monkeyPatchFunctionHolder(Object, 'values',
    (thisArg, args, originalFunction, patchedFunction) => {
      const bceTrace = peekBCEMatchCallee(patchedFunction);
      if (!bceTrace?.data?.argTids) {
        return originalFunction.apply(thisArg, args);
      }

      const {
        traceId: callId,
      } = bceTrace;

      const inputNodeIds = getOrCreateRealArgumentDataNodeIds(bceTrace, args);
      const ownObjectNodeId = inputNodeIds[0];
      const entries = ObjectEntries.apply(Object, args); // hackfix: use entries instead, to line up index + props
      const result = [];

      const ownVarAccess = null;
      const ownInputs = [ownObjectNodeId];
      const resultDataNode = dataNodeCollection.createBCEOwnDataNode(result, callId, DataNodeType.Compute, ownVarAccess, ownInputs);

      for (let i = 0; i < entries.length; ++i) {
        const targetTid = callId;
        const readAccess = {
          objectNodeId: ownObjectNodeId,
          prop: entries[i][0]
        };
        const readNode = dataNodeCollection.createDataNode(entries[i][1], targetTid, DataNodeType.Read, readAccess);

        const writeAccess = {
          objectNodeId: resultDataNode.nodeId,
          prop: i
        };
        dataNodeCollection.createWriteNodeFromReadNode(targetTid, readNode, writeAccess);

        // add to result
        result.push(entries[i][1]);
      }

      return result;
    }
  );

  [
    "assign",
    "defineProperties",
    "defineProperty",
    "keys",
    "entries",
    "fromEntries",

    "getOwnPropertyDescriptor",
    "getOwnPropertyDescriptors",
    "getOwnPropertyNames",
    "getOwnPropertySymbols",

    "is",
    "preventExtensions",
    "seal",
    "create",
    "freeze",
    "getPrototypeOf",
    "setPrototypeOf",
    "isExtensible",
    "isFrozen",
    "isSealed",
  ].forEach(key => monkeyPatchHolderOverrideDefault(Object, key));
}