import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { readFileSync } from 'fs';
import sumBy from 'lodash/sumBy';
import sum from 'lodash/sum';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import { EdgeStatus } from './edgeData';

export function makeEdgeTable(folder, experimentIds) {
  // traces: number of recorded trace events. AEs: recorded AEs by type (await, then, cb). falseTls: false TLs by type (TODO(types)). tlRatio: $\frac{realTls}{totalTls}$
  const headers = `name & traces & AEs & falseTls & tlRatio \\`;
  const rows = experimentIds.map(experimentId => {
    return tableRow(folder, experimentId);
  });
  return `${headers}\n${rows.join('\n')}`;
}

function tableRow(folder, experimentId) {
  const fpath = pathResolve(folder, experimentId);
  const data = readFileSync(fpath) || EmptyObject;
  const { appStats = {}, annotations = {} } = data;
  let { traceCount, aeCounts } = appStats;

  aeCounts = [...aeCounts];
  /* if (!aeCounts.length)  */aeCounts.splice(3, 1);

  const aeEdgeCount = sum(aeCounts);

  // compute timeline scenarios
  const falseTls = sumBy(annotations, anno =>
    anno.status > EdgeStatus.TimelineStart
  );
  const trueTls = sumBy(annotations, anno =>
    anno.status === EdgeStatus.TimelineStart
  );
  const totalTls = trueTls + falseTls;
  const tlRatio = trueTls / totalTls;

  return `${traceCount} & ${aeEdgeCount} (${aeCounts.join(', ')}) & ${falseTls} & ${tlRatio} \\`;
}