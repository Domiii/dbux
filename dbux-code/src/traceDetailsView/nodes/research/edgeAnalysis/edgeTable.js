import { pathResolve } from '@dbux/common-node/src/util/pathUtil'
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { readFileSync } from 'fs';

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
  const { annotations } = data;
  return `${name} & ${traces} & ${aeCounts} & ${falseTls} & ${tlRatio}`;
}