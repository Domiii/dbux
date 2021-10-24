/* eslint-disable quote-props */
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { existsSync, readFileSync } from 'fs';
import sumBy from 'lodash/sumBy';
import sum from 'lodash/sum';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import { newLogger } from '@dbux/common/src/log/logger';
import { EdgeStatus, ETC, getExperimentDataFilePath } from './edgeData';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('edgeTable');

export function makeEdgeTable(folder, experimentIds) {
  // 
  // traces: number of recorded trace events. AEs: recorded AEs by type (await, then, cb). falseTls: false TLs by type (TODO(types)). tlRatio: $\frac{realTls}{totalTls}$
  // const headers = `name & traces & AEs & C & MC & F & S & N \\\\`;
  const all = experimentIds.map(experimentId => {
    return tableRow(folder, experimentId);
  });
  const rows = all.map(x => x.row);
  const allRaw = all.map(x => x.raw);
  // return `${headers}\n${rows.join('\n')}`;
  return `${rows.join('\\\\\n')} \\\\\n\n\n% ${JSON.stringify(allRaw)}`;
}

// real thread counts
const rts = {
  '2048': 5,
  'async-js': 2,
  'bluebird': 3,
  'Editor.md': 21,
  'express': 1,
  'hexo': 2,
  'node-fetch': 1,
  'sequelize': 2,
  'socket.io': 1,
  'todomvc-es6': 6,
  'webpack': '1-3',
};

const order = [
  // TODO: enforce order
];

function getRt(experimentId) {
  const match = Object.entries(rts)
    .filter(([projectName]) => experimentId.startsWith(projectName));
  if (match.length !== 1) {
    throw new Error(`experiment does not have RT: ${experimentId} (${JSON.stringify(match)})`);
  }
  return match[0][1];
}

function tableRow(folder, experimentId) {
  const fpath = getExperimentDataFilePath(experimentId);
  const name = experimentId.split('#', 1)[0];
  try {
    const s = readFileSync(fpath);
    const data = JSON.parse(s);
    const { appStats = {}/* , annotations = {} */ } = data;
    let { traceCount, aeCounts, edgeTypeCounts } = appStats;

    traceCount = traceCount.toLocaleString('en-us');
    aeCounts = [...aeCounts];
    edgeTypeCounts = [...edgeTypeCounts];
    /* if (!aeCounts.length)  */aeCounts.splice(3, 1);
    
    // total threads = multi-chains + forks
    // edgeTypeCounts[3] = edgeTypeCounts[1] + edgeTypeCounts[2];
    edgeTypeCounts[ETC.TT] = edgeTypeCounts[ETC.F] + edgeTypeCounts[ETC.O];
    edgeTypeCounts[ETC.RT] = getRt(experimentId);
    edgeTypeCounts[ETC.Acc] = edgeTypeCounts[ETC.RT] / edgeTypeCounts[ETC.TT];
    
    // fix formatting
    edgeTypeCounts[ETC.O] = `\\corr{${edgeTypeCounts[ETC.O]}}`;
    edgeTypeCounts[ETC.Acc] = edgeTypeCounts[ETC.Acc].toFixed(2);
    edgeTypeCounts[ETC.N] = Math.round(edgeTypeCounts[ETC.N]); // edgeTypeCounts[5].toFixed(1);

    // const aeEdgeCount = sum(aeCounts);

    // compute timeline scenarios
    // const falseTls = sumBy(annotations, anno =>
    //   anno.status > EdgeStatus.TimelineStart
    // );
    // const trueTls = sumBy(annotations, anno =>
    //   anno.status === EdgeStatus.TimelineStart
    // );
    // const totalTls = trueTls + falseTls;
    // const tlRatio = trueTls / totalTls;

    return {
      raw: { name, traceCount/* , aeEdgeCount */, aeCounts, edgeTypeCounts },
      /* & ${aeEdgeCount} */
      row: `${name} & ${traceCount} & ${aeCounts.join(' & ')} & ${edgeTypeCounts.join(' & ')} `
    };
  }
  catch (err) {
    logError(`Could not get table data for ${experimentId} -`, err);
    return {
      raw: null,
      row: `${name} & `
    };
  }
}