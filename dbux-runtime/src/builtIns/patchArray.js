import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import dataNodeCollection from '../data/dataNodeCollection';
import traceCollection from '../data/traceCollection';
import valueCollection from '../data/valueCollection';
import { monkeyPatchMethod } from '../util/monkeyPatchUtil';

export default function patchArray(rm) {
  monkeyPatchMethod(Array, 'push', null,
    (arr, args) => {
      const ref = valueCollection.getRefByValue(arr);
      // if (globalThis.debugArray === arr) {
      //   console.debug('Array.push', ref);
      //   debugger;
      // }
      if (ref) {
        console.log(`pushing indexes [${args.map((_, i) => arr.length + i).join(',')}]`);
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
          dataNodeCollection.createOwnDataNode(args[i], traceId, DataNodeType.Write, varAccess);
        }
      }
    }
  );
}
