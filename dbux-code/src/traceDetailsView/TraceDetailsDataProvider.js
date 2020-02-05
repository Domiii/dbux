import { EventEmitter, Position } from "vscode";
import applicationCollection from 'dbux-data/src/applicationCollection';
import { codeLineToBabelLine } from '../helpers/locHelper';
import { getVisitedStaticTracesAt } from '../data/codeRange';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { ApplicationNode, StaticTraceNode, createTraceDetailsNode, EmptyNode, TraceNode } from './TraceDetailsNode';

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

  // ###########################################################################
  // tree building
  // ###########################################################################

  refresh = makeDebounce(() => {
    const {
      fpath,
      pos
    } = this.where;

    // add nodes for Applications, iff we have more than one
    const addApplicationNodes = applicationCollection.selection.data.getApplicationCountAtPath(fpath) > 1;

    this.rootNodes = applicationCollection.selection.data.mapApplicationsOfFilePath(fpath,
      (application, programId) => {
        let applicationNode;
        if (addApplicationNodes) {
          // add application nodes
          applicationNode = createTraceDetailsNode(ApplicationNode, application, application, null);
        }
        else {
          // don't add application nodes
          applicationNode = null;
        }
        
        const staticTraceNodes = this._buildStaticTraceNodes(programId, pos, application, applicationNode);
        return addApplicationNodes ? applicationNode : staticTraceNodes;
      }
    );

    // add empty node
    if (!this.rootNodes.length) {
      this.rootNodes.push(EmptyNode.instance);
    }

    this._onDidChangeTreeData.fire();
  }, 10)

  _buildStaticTraceNodes(programId, pos, application, parent) {
    const staticTraces = getVisitedStaticTracesAt(application, programId, pos);
    return staticTraces.map(staticTrace => {
      const node = createTraceDetailsNode(StaticTraceNode, staticTrace, application, parent);
      node.children = this._buildTraceNodes(staticTrace, application, node);
      return node;
    });
  }

  _buildTraceNodes(staticTrace, application, parent) {
    const { staticTraceId } = staticTrace;
    const traces = application.dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
    if (!traces) {
      // should never happen
      return null;
    }
    
    return traces.map(trace => {
      const node = createTraceDetailsNode(TraceNode, trace, application, parent);
      node.children = this._buildTraceDetailNodes();
      return node;
    });
  }

  _buildTraceDetailNodes() {
    return null;
  }

  // ###########################################################################
  // misc bookkeeping
  // ###########################################################################

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