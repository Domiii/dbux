import allApplications from '@dbux/data/src/applications/allApplications';
import PackageInfo from '@dbux/data/src/files/PackageInfo';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import StaticProgramContext from '@dbux/common/src/types/StaticProgramContext';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import TraceNode from '../../codeUtil/treeView/TraceNode';


/** ###########################################################################
 * {@link ProgramNode}
 * ##########################################################################*/

class ProgramNode extends BaseTreeViewNode {
  /**
   * @param {StaticProgramContext} program
   */
  static makeLabel(program) {
    // TODO: relative path to pkg
    return program.fileName;
  }

  // TODO: list recorded requires + functions?
}

/** ###########################################################################
 * {@link PackageNode}
 * ##########################################################################*/

class PackageNode extends BaseTreeViewNode {
  /**
   * @param {PackageInfo} pkg 
   */
  static makeLabel(pkg) {
    return pkg.name;
  }

  /**
   * @type {PackageInfo} package 
   */
  get package() { return this.entry; }

  init() {
    // const { package } = this;
    // this.description = `${traceLabel} @${loc}`;
    // this.tooltip = this.consoleMessage;
  }

  buildChildren() {
    return this.package.programs
      ?.map(program => {
        return this.treeNodeProvider.buildNode(ProgramNode, program, this);
      });
  }
}

/** ###########################################################################
 * {@link RecordedProgramsNode}
 *  #########################################################################*/

/**
 * Recorded programs by package.
 * 
 * NOTE: Babel uses the word `program` to refer to any cohesive chunk of JavaScript code, including
 * JavaScript files, <script>s etc.
 * 
 * In Node.js, all programs are modules by default.
 */
class RecordedProgramsNode extends BaseTreeViewNode {
  static makeLabel(/*entry, parent*/) {
    return `Recorded Programs`;
  }

  /**
   * Total amount of programs in all active applications.
   */
  nPrograms;

  /**
   * 
   */
  get packages() {
    return allApplications.selection.data.collectGlobalStats((dp) =>
      dp.queries.packages.getAll()
    );
  }

  init() {
    this.nPrograms = allApplications.selection.data.countStats((dp) =>
      dp.collections.staticProgramContexts.getCount()
    );

    this.description = `(${this.nPrograms} programs)`;
  }

  registerActiveEvents() {
    return allApplications.selection.data.collectGlobalStats((dp) =>
      dp.queries.packages.subscribe()
    );
  }

  buildChildren() {
    return this.packages
      ?.map(pkg => {
        return this.treeNodeProvider.buildNode(PackageNode, pkg, this);
      });
  }
}

/** ###########################################################################
 * {@link ImportsNode}
 * ##########################################################################*/

class RequireNode extends TraceNode {

}

class ImportsNode extends BaseTreeViewNode {
  static makeLabel(/*entry, parent*/) {
    return `Imports`;
  }

  tooltip = `All import and require statements`;

  get collapseChangeUserActionType() {
    return UserActionType.GlobalImportsUse;
  }


  init() {
    // TODO: import support
    this.requireTraces = allApplications.selection.data.collectGlobalStats((dp, app) => {
      return dp.util.getAllRequireTraces();
    });

    this.description = `(${this.requireTraces.length})`;
  }

  buildChildren() {
    // return this.packageNames
    //   ?.map(packageName => {
    //     return this.treeNodeProvider.buildNode(PackageNode, packageName, this);
    //   });
    return this.requireTraces
      ?.map(trace => {
        return this.treeNodeProvider.buildNode(RequireNode, trace, this);
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
    return `Modules, Programs, Files`;
  }

  tooltip = `Allows investigating executed JavaScript files and scripts.`;

  get collapseChangeUserActionType() {
    return UserActionType.GlobalProgramsUse;
  }

  childClasses = [
    RecordedProgramsNode,
    ImportsNode
  ];
}
