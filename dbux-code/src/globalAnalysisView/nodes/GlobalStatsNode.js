/**
 * @file 
 */

import { getCommonAncestorPath } from '@dbux/common-node/src/util/pathUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeStaticContextLabel, makeStaticContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import traceSelection from '@dbux/data/src/traceSelection';
import path from 'path';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import makeTreeItem, { makeTreeItems } from '../../helpers/makeTreeItem';

/** ###########################################################################
 * {@link GlobalStatsNode}
 * ##########################################################################*/

class ProgramStats {
  nTraces;
  /**
   * @type {[{ programId, dp }]}
   */
  programs;
}

export default class GlobalStatsNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `Global Stats`;
  }

  init() {
    this.description = `(${allApplications.selection.count} applications)`;
  }

  registerActiveEvents() {
    return allApplications.selection.data.collectGlobalStats((dp) =>
      dp.queryImpl.packages.subscribe()
    );
  }

  /** ###########################################################################
   * {@link #TracesByStaticContext}
   * ##########################################################################*/
  // eslint-disable-next-line camelcase
  Traces_by_Function = function Traces_by_Function() {
    const allStaticContextStats = allApplications.selection.data.collectGlobalStats((dp, app) => {
      const { applicationId } = app;
      const byStaticContext = {};
      dp.util.getTraceCountsByStaticContext(byStaticContext);
      const stats = Object.values(byStaticContext);
      stats.forEach(s => {
        s.dp = dp;
        s.label = makeStaticContextLabel(s.staticContextId, app);
        s.locLabel = makeStaticContextLocLabel(applicationId, s.staticContextId);
      });
      return stats;
    });

    // sort
    allStaticContextStats.sort((a, b) => b.nTraces - a.nTraces);

    return {
      children: () => allStaticContextStats.map(({ staticContextId, label, locLabel, nTraces, dp }) => {
        return makeTreeItem(
          `${nTraces}`,
          null,
          {
            description: `${label} (${locLabel})`,
            handleClick() {
              const trace = dp.util.getFirstTraceOfStaticContext(staticContextId);
              trace && traceSelection.selectTrace(trace, 'GlobalStatsNode');
            }
          }
        );
      }),
      props: {
        description: `${allStaticContextStats.length} static contexts`
      }
    };
  }

  /** ###########################################################################
   * {@link #Traces_by_Package}
   * ##########################################################################*/

  // eslint-disable-next-line camelcase
  Traces_by_Package = function Traces_by_Package() {
    // collect data
    const allPackageStats = allApplications.selection.data.collectGlobalStats((dp) => {
      const packages = dp.queries.packages.getAll();
      const byPackageName = Object.fromEntries(packages.map(pkg => ([pkg.rawName, {
        pkg,
        dp,
        programs: [],
        nTraces: 0
      }])));

      // count traces
      dp.util.getTraceCountsByPackageName(byPackageName);

      // get add one button per program (go to first executed file when clicked)
      for (const program of dp.collections.staticProgramContexts.getAllActual()) {
        const { programId } = program;
        const p = dp.util.getProgramPackageName(programId);

        const { programs } = byPackageName[p];
        const nTraces = dp.util.getTracesOfProgram(programId)?.length;
        if (nTraces) {
          programs.push({
            programId,
            path: dp.util.getFilePathFromProgramId(programId),
            nTraces
          });
        }
      }

      const statsArr = Object.values(byPackageName);

      // also sort all files
      statsArr.forEach(({ programs }) => {
        programs.sort((a, b) => b.nTraces - a.nTraces);
      });

      return statsArr;
    });

    // sort
    allPackageStats.sort((a, b) => b.nTraces - a.nTraces);

    // remove common ancestor file paths
    const pathPrefix = getCommonAncestorPath(...allPackageStats.flatMap(s => s.programs.map(p => p.path)));
    allPackageStats.forEach(s => {
      s.programs.forEach(p => {
        if (pathPrefix === p.path) {
          // only a single program
          p.path = path.basename(p.path);
        }
        else {
          p.path = p.path.substring(pathPrefix.length);
        }
      });
    });

    return {
      children: () => allPackageStats
        .map(({ dp, pkg, /* dp, */ programs, nTraces }) => {
          const programNodes = programs.map(({ programId, path: programPath, nTraces: programNTraces }) => {
            return makeTreeItem(
              `${programNTraces.toLocaleString('en-us')}`,
              null,
              {
                description: `${programPath}`,
                handleClick() {
                  const trace = dp.util.getFirstTraceOfProgram(programId);
                  trace && traceSelection.selectTrace(trace, 'GlobalStatsNode');
                }
              }
            );
          });
          return makeTreeItem(
            `${pkg.isLocalApplication ? '* ' : ''}${nTraces.toLocaleString('en-us')}`,
            programNodes,
            {
              description: `${pkg.name}`,
              handleClick() {
                const trace = dp.util.getFirstTraceOfProgram(programs[0].programId);
                trace && traceSelection.selectTrace(trace, 'GlobalStatsNode');
              }
            }
          );
        }),
      props: {
        description: `${allPackageStats.length} packages`
      }
    };
    // eslint-disable-next-line no-extra-bind
  }.bind(this);


  // eslint-disable-next-line camelcase
  Function_Stats = () => ({
    label: 'Function Stats',
    children: () => {
      const tracedFunctions = allApplications.selection.data.collectGlobalStats((dp, app) => {
        const tracesByStaticContext = {};
        dp.util.getTraceCountsByStaticContext(tracesByStaticContext);
        return Object.entries(tracesByStaticContext)
          .filter(([, s]) => !!s.nTraces) // only get actually ran staticContexts
          .map(([staticContextId]) => {
            staticContextId = parseInt(staticContextId, 10);
            const staticContext = dp.collections.staticContexts.getById(staticContextId);
            if (!staticContext) {
              return makeTreeItem(`invalid (${staticContext})`);
            }
            return makeTreeItem(
              staticContext.displayName,
              // makeStaticContextLabel(staticContext, app),
              null,
              {
                handleClick() {
                  const trace = dp.util.getFirstTraceOfStaticContext(staticContext.staticContextId);
                  traceSelection.selectTrace(trace);
                }
                // description: ``
              }
            );
          });
      });

      let monkeyCount = 0;
      const untracedFunctions = allApplications.selection.data.collectGlobalStats((dp, app) => {
        return Object.entries(dp.util.getAllUntracedFunctionCallsByRefId())
          .map(([refId, bceTraces]) => {
            const bceTrace = bceTraces[0];
            const callee = dp.util.getCalleeTrace(bceTrace.traceId);
            refId = parseInt(refId, 10);
            const monkey = !!dp.collections.values.getById(refId)?.monkey;
            monkeyCount += monkey;
            return makeTreeItem(
              makeTraceLabel(callee),
              null,
              {
                handleClick() {
                  traceSelection.selectTrace(bceTrace);
                },
                description: `${monkey ? '🐵' : ''}`
              }
            );
          });
      });

      return [
        makeTreeItem(
          'Recorded',
          tracedFunctions,
          {
            description: `(${tracedFunctions.length})`
          }
        ),
        makeTreeItem(
          'Not Recorded',
          untracedFunctions,
          {
            description: `(${untracedFunctions.length}, ${monkeyCount} x 🐵, ${untracedFunctions.length - monkeyCount} x 🙈))`
          }
        ),
      ];
    }
  });

  nodes() {
    return [
      this.Traces_by_Function,
      this.Traces_by_Package,
      this.Function_Stats
    ];
  }

  buildChildren() {
    return makeTreeItems(...this.nodes());
  }
}