import allApplications from '@dbux/data/src/applications/allApplications';
import PackageInfo from '@dbux/data/src/files/PackageInfo';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import StaticProgramContext from '@dbux/common/src/types/StaticProgramContext';
import traceSelection from '@dbux/data/src/traceSelection';
import { pathRelative } from '@dbux/common-node/src/util/pathUtil';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import TraceNode from '../../codeUtil/treeView/TraceNode';


/** ###########################################################################
 * {@link ProgramNode}
 * ##########################################################################*/

class ProgramNode extends BaseTreeViewNode {
  /**
   * @param {StaticProgramContext} program
   */
  static makeLabel(program, parent) {
    const { package: pkg } = parent;

    return pkg?.folder ?
      pathRelative(pkg.folder, program.filePath) :
      program.fileName;
  }

  get package() {
    return this.parent.package;
  }

  get programId() {
    return this.program.programId;
  }

  /**
   * @type {StaticProgramContext}
   */
  get program() {
    return this.entry;
  }

  get dp() {
    const { applicationId } = this.program;
    return allApplications.getById(applicationId).dataProvider;
  }

  // TODO: render some sort of "selected" icon if selectedTrace is in program

  init() {
    const { dp, programId } = this;
    this.nExecutedFunctions = dp.util.countExecutedFunctionsOfProgram(programId);
    this.description = `(${this.nExecutedFunctions} ƒ)`;
    this.tooltip = this.program.filePath;
  }

  handleClick() {
    const trace = this.dp.util.getFirstTraceOfProgram(this.programId);
    trace && traceSelection.selectTrace(trace, 'TraceNode');
  }

  // buildChildren() {
  //   // TODO: list recorded requires + functions?
  // }
}

/** ###########################################################################
 * {@link PackageNode}
 * ##########################################################################*/

class PackageNode extends BaseTreeViewNode {
  /**
   * @param {PackageInfo} pkg 
   */
  static makeLabel(pkg) {
    // TODO: `${pkg.name}@${version}`
    return pkg.name;
  }

  /**
   * @type {PackageInfo} package 
   */
  get package() { return this.entry; }

  init() {
    // const { package } = this;
    // this.description = `${traceLabel} @${loc}`;

    // TODO: if not cached yet: start asynchronously fetching version from `package.json` and store in a cache
    //    -> once returned, re-render this node only
    //    -> add version in makeLabel

    this.description = `(${this.package.programs?.length || 0})`;
    this.tooltip = this.package.folder;
  }

  buildChildren() {
    return this.package.programs
      ?.map(program => {
        return this.treeNodeProvider.buildNode(ProgramNode, program, this);
      });
  }
}

/** ###########################################################################
 * {@link RecordedPackagesNode}
 *  #########################################################################*/

/**
 * Recorded programs by package.
 * 
 * NOTE: Babel uses the word `program` to refer to any cohesive chunk of JavaScript code, including
 * JavaScript files, <script>s etc.
 * 
 * In Node.js, all programs are modules by default.
 */
export class RecordedPackagesNode extends BaseTreeViewNode {
  static makeLabel(/*entry, parent*/) {
    // NOTE: "module" is a more well-known term, despite not being quite accurate
    return `Recorded Packages`;
  }

  /**
   * Total amount of programs in all active applications.
   */
  nPrograms;

  init() {
    this.nPrograms = allApplications.selection.data.countStats((dp) =>
      dp.collections.staticProgramContexts.getCount()
    );

    // TODO: update with accurate package count when opening the node?
    this.description = `(${this.nPrograms} files)`;
  }

  registerActiveEvents() {
    return allApplications.selection.data.collectGlobalStats((dp) =>
      dp.queryImpl.packages.subscribe()
    );
  }

  buildChildren() {
    const packages = allApplications.selection.data.collectGlobalStats((dp) =>
      dp.queries.packages.getAll()
    );
    if (!packages) {
      return null;
    }
    packages.sort((a, b) => {
      // -> put default package to the top
      if (a.order && b.order && a.order !== b.order) {
        return b.order - a.order;
      }
      if (a.order) {
        return -1;
      }
      if (b.order) {
        return 1;
      }

      const aApp = allApplications.getApplication(a.programs[0].applicationId);
      const bApp = allApplications.getApplication(b.programs[0].applicationId);
      return bApp.createdAt - aApp.createdAt;
    });

    return packages
      .map(pkg => {
        return this.treeNodeProvider.buildNode(PackageNode, pkg, this);
      });
  }

  // TODO: render some sort of "selected" icon if selectedTrace is in package

  handleClick() {
    // TODO: reveal node + go to first trace of package
  }
}

/** ###########################################################################
 * {@link ImportsNode}
 * ##########################################################################*/

class RequireNode extends TraceNode {

}

export class ImportsNode extends BaseTreeViewNode {
  static makeLabel(/*entry, parent*/) {
    return `Imports`;
  }

  tooltip = `All import and require statements`;

  get collapseChangeUserActionType() {
    return UserActionType.GlobalImportsUse;
  }


  init() {
    // future-work: import support
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
