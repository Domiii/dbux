import isFunction from 'lodash/isFunction';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import { get, set } from '../memento';
import _nodeRegistry from './nodes/_nodeRegistry';
import { showInformationMessage } from '../codeUtil/codeModals';

/** @typedef {import('./dialogController').DialogController} DialogController */

const Verbose = false;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Dialog');

export class Dialog {
  /**
   * @type {DialogController}
   */
  controller;
  constructor(graph, defaultStartState) {
    this.graph = graph;
    this.mementoKeyName = `dbux.dialog.${graph.name}`;
    this.graphState = null;
    this.stack = null;
    this._resume = null;
    this._gotoState = null;
    this._isActive = false;
    this._version = 0;
    this.load(defaultStartState);

    if (!this.getNode('cancel')) {
      throw new Error(`Dialog ${graph.name} needs to contain a cancel state`);
    }
  }

  // ###########################################################################
  // public
  // ###########################################################################

  start(startState) {
    if (this._resume) {
      _errWrap(this.resume.bind(this))((startState));
    }
    else {
      _errWrap(this._start.bind(this))(startState);
    }
  }

  async _start(startState) {
    if (startState) {
      this.setState(startState);
    }

    debug('Dialog._start', JSON.stringify({ startState, nodeName: this.graphState.nodeName }));

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
        // this.controller.startDialog(this.graph.name, startState);
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

      let nextState, edgeLabel;
      if (this._gotoState) {
        // handle goTo passed to enter
        nextState = this._gotoState;
        edgeLabel = null;
        this.gotoState = null;
      }
      else {
        const edgeData = await NodeClass.render(this, node);
        if (version !== this._version) {
          return;
        }
        if (edgeData) {
          await edgeData.edge.click?.(...this._getUserCbArguments(node));
          nextState = await this.maybeGetByFunction(edgeData.edge.node, node) || nodeName;
          edgeLabel = edgeData.edgeLabel;
        }
        else {
          nextState = null;
          edgeLabel = null;
        }
      }

      this.stack.push({ name: nodeName, edgeLabel });

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
        await this.graph.onEnd?.(getRecordedData(this));
        break;
      }
    }

    this._isActive = false;
  }

  getRecordedData() {
    return getRecordedData(this);
  }

  setState(nodeName) {
    if (this._isActive) {
      throw new Error('Cannot set graphState when dialog is active');
    }
    this._setState(nodeName);
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

    getRecordedData: this.getRecordedData.bind(this),

    startDialog: (dialogName, startState) => {
      this.controller.startDialog(dialogName, startState);
    },

    serializeSurveyResult: async () => {
      return await this.controller.serializeSurveyResult();
    }
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

  async resume(startState) {
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

  _setState(nodeName) {
    this.graphState.nodeName = nodeName;
    this.graphState.stateStartTime = Date.now();
  }

  // ###########################################################################
  // save/load in memento
  // ###########################################################################

  async save() {
    await set(this.mementoKeyName, { graphState: this.graphState, stack: this.stack });
  }

  /**
   * @param {string} [startState] if given, overrides the current state
   */
  load(defaultStartState = 'start') {
    const { graphState, stack } = get(this.mementoKeyName, {
      graphState: { nodeName: defaultStartState, stateStartTime: Date.now(), data: {} },
      stack: []
    });

    this.graphState = graphState;
    this.stack = stack;
  }

  async clear() {
    await set(this.mementoKeyName, undefined);
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

export function getRecordedData(dialog) {
  return { stack: dialog.stack, data: dialog.graphState.data };
}