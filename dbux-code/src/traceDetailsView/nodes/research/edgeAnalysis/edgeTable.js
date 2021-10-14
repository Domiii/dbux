import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { existsSync, readFileSync } from 'fs';
import sumBy from 'lodash/sumBy';
import sum from 'lodash/sum';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import { newLogger } from '@dbux/common/src/log/logger';
import { EdgeStatus } from './edgeData';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('edgeTable');

export function makeEdgeTable(folder, experimentIds) {
  // 
  // traces: number of recorded trace events. AEs: recorded AEs by type (await, then, cb). falseTls: false TLs by type (TODO(types)). tlRatio: $\frac{realTls}{totalTls}$
  // const headers = `name & traces & AEs & C & MC & F & S & N \\\\`;
  const rows = experimentIds.map(experimentId => {
    return tableRow(folder, experimentId);
  });
  // return `${headers}\n${rows.join('\n')}`;
  return `${rows.join('\\\\\n')} \\\\`;
}

function tableRow(folder, experimentId) {
  const fpath = pathResolve(folder, experimentId, 'edgeAnnotations.json');
  const name = experimentId.split('#', 1)[0];
  try {
    const s = readFileSync(fpath);
    const data = JSON.parse(s);
    const { appStats = {}/* , annotations = {} */ } = data;
    let { traceCount, aeCounts, edgeTypeCounts } = appStats;

    aeCounts = [...aeCounts];
    edgeTypeCounts = [...edgeTypeCounts];
    /* if (!aeCounts.length)  */aeCounts.splice(3, 1);

    const aeEdgeCount = sum(aeCounts);

    // compute timeline scenarios
    // const falseTls = sumBy(annotations, anno =>
    //   anno.status > EdgeStatus.TimelineStart
    // );
    // const trueTls = sumBy(annotations, anno =>
    //   anno.status === EdgeStatus.TimelineStart
    // );
    // const totalTls = trueTls + falseTls;
    // const tlRatio = trueTls / totalTls;

    edgeTypeCounts[4] = edgeTypeCounts[4].toFixed(1);  // avg

    return `${name} & ${traceCount} & ${aeEdgeCount} & ${aeCounts.join(' & ')} & ${edgeTypeCounts.join(' & ')} `;
  }
  catch (err) {
    logError(`Could not get table data for ${experimentId} -`, err);
    return `${name} & `;
  }
}