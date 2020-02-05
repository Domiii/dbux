import { EventEmitter, Position } from "vscode";
import applicationCollection from 'dbux-data/src/applicationCollection';
import { codeLineToBabelLine } from '../helpers/locHelper';
import { getVisitedStaticTracesAt } from '../data/codeRange';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { TraceDetailsApplicationNode, TraceDetailsStaticTraceNode, makeTraceDetailsNode } from './TraceDetailsNode';

export default class TraceDetailsDataProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  rootNodes;

  constructor() {
  }

  /**
   * @param {Position} pos 
   */
  setSelected(where) {
    this.where = where;

    this.refresh();
  }

  refresh = makeDebounce(() => {
    const {
      fpath,
      pos
    } = this.where;

    const hasMultipleApplications = applicationCollection.selection.data.getApplicationCountAtPath(fpath) > 1;

    this.roots = applicationCollection.selection.data.mapApplicationsOfFilePath(fpath,
      (application, programId) => {
        let parent;
        if (hasMultipleApplications) {
          // add application nodes
          parent = makeTraceDetailsNode(TraceDetailsApplicationNode, application, application, null);
        }
        else {
          // don't add application nodes
          parent = null;
        }
        
        const staticTraces = getVisitedStaticTracesAt(application, programId, pos);
        const staticTraceNodes = staticTraces.map(staticTrace => {
          return makeTraceDetailsNode(TraceDetailsStaticTraceNode, staticTrace, application, parent);
        });
        
        const roots = hasMultipleApplications ? [parent] : staticTraceNodes;
        return roots;
      }
    );

    this._onDidChangeTreeData.fire();
  })

  clear() {
    this.refresh();
  }

  getTreeItem = (node) => {
    return node;
  }

  getChildren = (node) => {
    if (node) {
      return node.children;
    }
    else {
      return this.rootNodes;
    }
  }

  getParent = (node) => {
    return node.parent;
  }
}