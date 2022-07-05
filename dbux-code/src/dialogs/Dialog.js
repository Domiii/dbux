import isFunction from 'lodash/isFunction';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import { get, set } from '../memento';
import _nodeRegistry from './nodes/_nodeRegistry';
import { showInformationMessage } from '../codeUtil/codeModals';

/** @typedef {import('./dialogController').default} DialogController */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Dialog');

const Verbose = false;
// const Verbose = true;

export default class Dialog {
  /**
   * @type {DialogController}
   */
  controller;
  
  constructor(controller, graph) {
    this.controller = controller;
    this.graph = graph;
    this.mementoKeyName = `dbux.dialog.${graph.name}`;
    this.graphState = null;
    this.stack = null;
    this._resume = null;
    this._gotoState = null;
    this._isActive = false;
    this._version = 0;
    this.logger = newLogger(`Dialog ${graph.name}`);
    this.load();

    if (!this.getNode('cancel')) {
      throw new Error(`Dialog ${graph.name} needs to contain a cancel state`);
    }
  }

  // ###########################################################################
  // public
  // ###########################################################################

  get started() {
    if (this.getCurrentNode()?.start) {
      // currently on `start node` e.g. waitToStart
      return false;
    }
    return !!this.graphState.nodeName;
  }

  async start(startState) {
    if (this._resume) {
      this.resume(startState);
    }
    else {
      await this._start(startState);
    }
  }

  async _start(startState) {
    if (startState) {
      this._setState(startState);
    }
    else if (!this.graphState.nodeName) {
      this._setState('start');
    }

    Verbose && this.logger.log('Dialog._start', JSON.stringify({ startState, nodeName: this.graphState.nodeName }));

    const firstNode = this.getNode(this.graphState.nodeName);

    if (firstNode.end) {
      let shouldRestart;
      if (this.graphState.nodeName === 'cancel') {
        shouldRestart = true;
      }
      else {
        shouldRestart = await this.askToRestart();
      }
      if (shouldRestart) {
        this._setState(startState || 'start');
      }
      else {
        return;
      }
    }

    this._isActive = true;
    const version = ++this._version;
    while (this.graphState.nodeName !== null) {
      Verbose && debug(`current state: ${this.graphState.nodeName}`);

      await this.save();

      const { nodeName } = this.graphState;
      const node = this.getNode(nodeName);
      const NodeClass = this.getNodeClass(node);

      await node.enter?.(...this._getUserCbArguments(node));
      this.resume();

      let nextState, edgeLabel;
      if (this._gotoState) {
        // handle goTo passed to enter
        nextState = this._gotoState;
        edgeLabel = null;
        this._gotoState = null;
      }
      else {
        this.handleNewNode(nodeName, node);
        const edgeData = await NodeClass.render(this, node);
        if (version !== this._version) {
          return;
        }
        if (edgeData) {
          this.handleNewEdge(edgeData.edge);
          await edgeData.edge.click?.(...this._getUserCbArguments(node));
          if (this._gotoState) {
            // handle goTo passed to enter
            nextState = this._gotoState;
            edgeLabel = null;
            this._gotoState = null;
          }
          else {
            nextState = await this.maybeGetByFunction(edgeData.edge.node, node) || nodeName;
            edgeLabel = edgeData.edgeLabel;
          }
        }
        else {
          nextState = null;
          edgeLabel = null;
        }
      }

      this._pushStack(nodeName, edgeLabel);

      if (!node.end) {
        if (nextState) {
          this._setState(nextState);
        }
        else {
          // nextState === null means user dismiss the message box, no further state transition
          break;
        }
      }
      else {
        await this.graph.onEnd?.(this.getRecordedData());
        break;
      }
    }

    this._isActive = false;
  }

  getRecordedData() {
    return { stack: this.stack, data: this.graphState.data };
  }

  async setState(nodeName) {
    if (this._isActive) {
      throw new Error('Cannot set graphState when dialog is active');
    }
    this._setState(nodeName);
    await this.save();
  }

  getNode(nodeName) {
    if (!nodeName) {
      return null;
    }
    const node = this.graph.nodes[nodeName];
    if (!node) {
      throw new Error(`DialogNode '${nodeName}' not exist`);
    }
    return node;
  }

  getNodeClass(node) {
    return _nodeRegistry[node.kind];
  }

  getCurrentNode() {
    return this.getNode(this.graphState.nodeName);
  }

  // ###########################################################################
  // util
  // ###########################################################################

  // ########################################
  // utilities provided to graph in `enter`/`click` functions
  // ########################################

  actions = {
    /**
     * This should not be used in `click`
     * @param {string} nodeName 
     */
    goTo: (nodeName) => {
      this._gotoState = nodeName;
    },

    /**
     * Wait for `delay` seconds, resolved to a nodeName if user try to resume, otherwise resolved to undefined
     * @param {number} delaySeconds time in seconds
     * @return {Promise<string|undefined>}
     */
    waitAtMost: async (delaySeconds) => {
      const delay = delaySeconds * 1000;
      const timePassed = Date.now() - this.graphState.stateStartTime;
      return Promise.race([sleep(delay - timePassed), new Promise(resolve => {
        this._resume = resolve;
      })]).then(() => {
        this._resume = null;
      });
    },

    // startDialog: (dialogName, startState) => {
    //   this.controller.startDialog(dialogName, startState);
    // },

    serializeSurveyResult: async () => {
      return await this.controller.serializeSurveyResult();
    },

    getRecordedData: this.getRecordedData.bind(this)
  };

  // ########################################
  // private utils
  // ########################################

  async maybeGetByFunction(valueOrFunction, node) {
    if (isFunction(valueOrFunction)) {
      return await valueOrFunction(...this._getUserCbArguments(node));
    }
    else {
      return valueOrFunction;
    }
  }

  async makeButtonsByEdges(node, edges) {
    const availableEdges = (await Promise.all(edges.map((e) => {
      return this.maybeGetByFunction(e, node);
    }))).filter(x => !!x);

    const buttonEntries = await Promise.all(availableEdges.map(async (edge) => {
      const edgeLabel = await this.maybeGetByFunction(edge.text, node);
      return [edgeLabel, () => ({ edge, edgeLabel })];
    }));

    return Object.fromEntries(buttonEntries);
  }

  resume(startState) {
    if (this._resume) {
      const r = this._resume;
      this._resume = null;
      r(startState || this.graphState.nodeName);
    }
  }

  /**
   * Used when dialog starts if survey is done
   * @return {Promise<boolean|null>}
   */
  async askToRestart() {
    // TOTRANSLATE
    return await showInformationMessage(`You have done this already. Do you want to restart?`, {
      'Yes, restart it'() {
        return true;
      },
      'No'() {
        return false;
      }
    });
  }

  /**
   * Used before dialog starts if survey is unfinished
   */
  async askToContinue() {
    // TOTRANSLATE
    return await showInformationMessage(`You have previously started ${this.graph.name}, would you like to continue?`, {
      'Continue'() {
        return true;
      },
      'Don\'t ask me again'() {
        return false;
      }
    });
  }

  _getUserCbArguments(node) {
    return [this.graphState, this.stack, this.actions, node];
  }

  /**
   * Set graphState
   * @param {string|null} nodeName Set graphState to given nodeName, or null to clear
   */
  _setState(nodeName) {
    if (nodeName) {
      this.graphState.nodeName = nodeName;
      this.graphState.stateStartTime = Date.now();
      // this._pushStack(nodeName);
    }
    else if (nodeName === null) {
      this.graphState.nodeName = null;
      this.graphState.stateStartTime = null;
      // this._pushStack(null);
    }
    else {
      throw new Error(`Trying to setState of dialog '${this.graph.name}' with unexpected falsy value ${nodeName}`);
    }
  }

  _pushStack(name, edgeLabel = null) {
    this.stack.push({ name, edgeLabel });
  }

  // ###########################################################################
  // save/load in memento
  // ###########################################################################

  async save() {
    await set(this.mementoKeyName, { graphState: this.graphState, stack: this.stack });
  }

  load() {
    const { graphState, stack } = get(this.mementoKeyName, {
      graphState: { nodeName: null, stateStartTime: null, data: {} },
      stack: []
    });

    this.graphState = graphState;
    this.stack = stack;
  }

  async clear() {
    await set(this.mementoKeyName, undefined);
    this.load();
  }

  /** ###########################################################################
   * debug
   *  #########################################################################*/

  handleNewNode(nodeId, node) {
    this.logger.log(`Enter new node ${nodeId}`, node);
  }

  handleNewEdge(edge) {
    this.logger.log(`Enter new edge`, edge);
  }
}

function _errWrap(f) {
  return async (...args) => {
    try {
      await f(...args);
    }
    catch (err) {
      logError(`Error in dialog:`, err);
    }
  };
}