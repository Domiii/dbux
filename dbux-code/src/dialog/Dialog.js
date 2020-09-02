import isFunction from 'lodash/isFunction';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import { get, set } from '../memento';
import _nodeRegistry from './nodes/_nodeRegistry';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Dialog');

export class Dialog {
  constructor(graph) {
    this.graph = graph;
    this.mementoKeyName = `dbux.dialog.${graph.name}`;
    this.graphState = null;
    this.stack = null;
    this.resume = null;
    this._gotoState = null;
    this._isActive = false;
    this.load();
  }

  start(startState) {
    if (!this._isActive) {
      _errWrap(this._start.bind(this))(startState);
    }
    else if (this._resume) {
      const r = this._resume;
      this._resume = null;
      r(startState);
    }
  }

  async _start(startState) {
    // for debugging
    await this.clear();
    this.load(startState);

    if (this.getNode(this.graphState.nodeName).end) {
      // skip if already reach end
      return;
    }

    this._isActive = true;
    while (this.graphState.nodeName !== null) {
      debug(`current state: ${this.graphState.nodeName}`);

      const node = this.getNode(this.graphState.nodeName);
      const NodeClass = _nodeRegistry[node.kind];

      await node.enter?.(...this.getUserCbArguments(node));

      let nextState, edgeLabel;
      if (this._gotoState) {
        nextState = this._gotoState;
        this.gotoState = null;
      }
      else {
        const result = await NodeClass.render(this, node);
        nextState = result?.nodeName || null;
        edgeLabel = result?.edgeLabel || null;
      }

      this.stack.push({ name: this.graphState.nodeName, edgeLabel });
      if (!node.end) { 
        this.graphState.nodeName = nextState;
        this.graphState.stateStartTime = Date.now();
      }
      else {
        break;
      }

      if (this.graphState.nodeName !== null) {
        await this.save();
      }
    }

    this._isActive = false;
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
      return Promise.race(sleep(delay - timePassed), new Promise(resolve => {
        this._resume = resolve;
      }));
    },

    getRecordedData: () => {
      return getRecordedData(this);
    }
  };

  // ########################################
  // private utils
  // ########################################

  async maybeGetByFunction(valueOrFunction, ...args) {
    if (isFunction(valueOrFunction)) {
      return await valueOrFunction(...args);
    }
    else {
      return valueOrFunction;
    }
  }

  async makeButtonsByEdges(node, edges, defaultState = null) {
    const buttonEntries = await Promise.all((await Promise.all(edges.map((e) => this.maybeGetByFunction(e, this.getUserCbArguments(node)))))
      .filter(x => !!x)
      .map(async (edge) => {
        const edgeLabel = await this.maybeGetByFunction(edge.text, ...this.getUserCbArguments(node));
        const clickCB = async () => {
          await edge.click?.(...this.getUserCbArguments(node));
          return { nodeName: edge.node || defaultState, edgeLabel };
        };
        return [edgeLabel, clickCB];
      }));

    return Object.fromEntries(buttonEntries);
  }

  getUserCbArguments(node) {
    return [this.graphState, this.stack, this.actions, node];
  }

  getNode(nodeName) {
    const node = this.graph.nodes[nodeName];
    if (!node) {
      throw new Error(`DialogNode '${nodeName}' not exist`);
    }
    return node;
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
  load(startState) {
    const { graphState, stack } = get(this.mementoKeyName, {
      graphState: { nodeName: 'start', stateStartTime: Date.now(), data: {} },
      stack: []
    });

    if (startState) {
      graphState.nodeName = startState;
    }

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
  return dialog.stack;
}