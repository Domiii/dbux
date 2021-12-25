import allApplications from '@dbux/data/src/applications/allApplications';
import { makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import StaticProgramContext from '@dbux/common/src/types/StaticProgramContext';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';


/** ###########################################################################
 * {@link InstrumentedModulesNode}
 *  #########################################################################*/

class InstrumentedModulesNode extends BaseTreeViewNode {
  static makeLabel(/*entry, parent*/) {
    return `Instrumented Modules`;
  }

  /**
   * @type {StaticProgramContext[]}
   */
  programs;

  init() {
    this.programs = allApplications.selection.data.collectGlobalStats((dp, app) => {
      return dp.collections.staticProgramContexts.getAllActual();
    });

    this.description = `(${this.programs.length})`;
  }

  buildChildren() {
    // return this.packageNames
    //   ?.map(packageName => {
    //     return this.treeNodeProvider.buildNode(PackageNode, packageName, this);
    //   });
    return this.programs
      ?.map(program => {
        return this.treeNodeProvider.buildNode(PackageNode, label, this);
      });
  }
}


/** ###########################################################################
 * {@link PackageNode}
 * ##########################################################################*/

class PackageNode extends BaseTreeViewNode {
  static makeLabel(packageName) {
    return packageName;
  }

  init() {
    // const { trace } = this;
    // this.description = `${traceLabel} @${loc}`;
    // this.tooltip = this.consoleMessage;
  }
}

class ImportedPackagesNode extends BaseTreeViewNode {
  static makeLabel(/*entry, parent*/) {
    return `Imported Packages`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalImportsUse;
  }

  init() {
    // TODO: import support
    this.packageNames = allApplications.selection.data.collectGlobalStats((dp, app) => {
      return dp.util.getAllRequirePackageNames();
    });

    this.description = `(${this.packageNames.length})`;
  }

  buildChildren() {
    // return this.packageNames
    //   ?.map(packageName => {
    //     return this.treeNodeProvider.buildNode(PackageNode, packageName, this);
    //   });
    return this.requireTraces
      ?.map(trace => {
        const label = makeTraceLabel(trace);
        return this.treeNodeProvider.buildNode(PackageNode, label, this);
      });
  }
}


/** ###########################################################################
 * {@link GlobalModulesNode}
 *  #########################################################################*/


/**
 * TODO: use TraceContainerNode
 */
export default class GlobalModulesNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `Modules`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalModulesUse;
  }

  childClasses = [
    InstrumentedModulesNode,
    ImportedPackagesNode
  ];
}
