/* eslint-disable quote-props */
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { existsSync, readFileSync } from 'fs';
import mean from 'lodash/mean';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import { newLogger } from '@dbux/common/src/log/logger';
import { EdgeStatus, ETC, getExperimentDataFilePath } from './edgeData';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('edgeTable');


function tableString(data) {
  const rows = data.map(x => x.row);
  // return `${headers}\n${rows.join('\n')}`;
  return `${rows.join('\\\\\n')} \\\\\n`;
}

export function makeEdgeTable(folder, experimentIds) {
  // 
  // traces: number of recorded trace events. AEs: recorded AEs by type (await, then, cb). falseTls: false TLs by type (TODO(types)). tlRatio: $\frac{realTls}{totalTls}$
  // const headers = `name & traces & AEs & C & MC & F & S & N \\\\`;
  const nameCounts = new Map();
  const unsorted = experimentIds.map(experimentId => {
    return tableRow(folder, experimentId, nameCounts);
  });

  // fix duplicate naming
  fixNames(unsorted, nameCounts);

  // sort
  const sorted = [...unsorted];
  sortRows(sorted);

  const allRaw = sorted.map(x => x.raw);

  // finish up
  return [
    tableString(sorted),
    tableString(unsorted),
    `% ${JSON.stringify(allRaw)}`
  ].join('\n\n\n\n');
}


/** ###########################################################################
 * {@link tableRow}
 * ##########################################################################*/

/**
 * NOTE: See `ETC` enum for all columns behind AE counts.
 */
function tableRow(folder, experimentId, nameCount) {
  const fpath = getExperimentDataFilePath(experimentId);
  const name = experimentId.split('#', 1)[0];
  try {
    const s = readFileSync(fpath);
    const data = JSON.parse(s);
    const { appStats = {}/* , annotations = {} */ } = data;
    let { traceCount, aeCounts, edgeTypeCounts, ...moreStats } = appStats;

    traceCount = traceCount.toLocaleString('en-us');
    aeCounts = [...aeCounts];
    edgeTypeCounts = [...edgeTypeCounts];
    /* if (!aeCounts.length)  */aeCounts.splice(3, 1);

    // total threads = multi-chains + forks
    // edgeTypeCounts[3] = edgeTypeCounts[1] + edgeTypeCounts[2];
    edgeTypeCounts[ETC.TT] = edgeTypeCounts[ETC.F] + edgeTypeCounts[ETC.O];
    const rt = getRt(experimentId);
    if (!Array.isArray(rt)) {
      edgeTypeCounts[ETC.RT] = rt;
      edgeTypeCounts[ETC.Acc] = edgeTypeCounts[ETC.RT] / edgeTypeCounts[ETC.TT];
    }
    else {
      edgeTypeCounts[ETC.RT] = rt.join('-');
      edgeTypeCounts[ETC.Acc] = mean(rt) / edgeTypeCounts[ETC.TT];
    }

    // fix formatting
    // edgeTypeCounts[ETC.O] = `\\corr{${edgeTypeCounts[ETC.O]}}`;
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

    // handle name duplicates
    const iName = nameCount.get(name) || 0;
    nameCount.set(name, iName + 1);

    return {
      name,
      iName,
      raw: { name, iName, traceCount/* , aeEdgeCount */, aeCounts, edgeTypeCounts, ...moreStats },
      /* & ${aeEdgeCount} */
      row: ` & ${traceCount} & ${aeCounts.join(' & ')} & ${edgeTypeCounts.join(' & ')} `
    };
  }
  catch (err) {
    logError(`Could not get table data for ${experimentId} -`, err);
    return {
      name,
      raw: null,
      row: `${name} & `
    };
  }
}

/** ###########################################################################
 * util
 * ##########################################################################*/

// real thread counts
const rts = {
  '2048': 5,
  'async-js': 2,
  'bluebird': 3,
  'Editor.md': 32,
  'express': 1,
  'hexo': 2,
  'node-fetch': 1,
  'sequelize': 2,
  'socket.io': 1,
  'todomvc-es6': 6,
  'webpack': [1, 3],
};

/**
 * RT = real thread count
 */
function getRt(experimentId) {
  const match = Object.entries(rts)
    .filter(([projectName]) => experimentId.startsWith(projectName));
  if (match.length !== 1) {
    // throw new Error(`experiment does not have RT: ${experimentId} (${JSON.stringify(match)})`);
    return NaN;
  }
  return match[0][1];
}

const projectOrder = [
  'getting-started',

  'express',
  'hexo',

  'async-js',
  'bluebird',
  'node-fetch',
  'sequelize',
  'socket.io',
  'webpack',

  '2048',
  'Editor.md',
  'todomvc-es6',
];

const nameMap = {
  'todomvc-es6': 'todomvc'
};

/**
 * @param {[]} rows 
 */
function sortRows(rows) {
  const sorter = Object.fromEntries(projectOrder.map((name, i) => ([name, i])));

  // sanity checks
  rows.forEach(r => {
    if (!(r.name in sorter)) {
      throw new Error(`projectOrder missing row name: ${r.name}`);
    }
  });

  // sort
  rows.sort((a, b) => sorter[a.name] - sorter[b.name]);
}

function fixNames(rows, nameCounts) {
  // add first column (fix duplicate naming)
  const duplicateNames = new Set(Array.from(nameCounts.entries())
    .filter(([, i]) => i > 1)
    .map(([name]) => name)
  );
  rows.forEach(r => {
    const { iName, name } = r;
    let label = duplicateNames.has(name) ? makeRowLabel(name, iName) : name;
    r.row = label + r.row;
  });
}



function makeRowLabel(name, i) {
  name = nameMap[name] || name;
  return `${name}(${i + 1})`;
}