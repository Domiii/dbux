import pull from 'lodash/pull';
import { newLogger } from '@dbux/common/src/log/logger';

export default class ContextProvider {
  owner;
  contexts;
  logger;
  subscriptions = new Map();

  constructor(owner, initialContexts) {
    this.owner = owner;
    this.contexts = initialContexts || [];
    this.logger = newLogger('ContextProvider');
  }

  getContext(name) {
    return this.contexts[name];
  }

  // ###########################################################################
  // subscription
  // ###########################################################################

  getComponents(name) {
    return this.subscriptions.get(name);
  }

  subscribe(component) {
    const { onContexts } = component;
    if (onContexts) {
      for (const name in onContexts) {
        // const handler = onContexts[name];
        this._subscribeContexts(component, name);
      }

      // propagate recursively
    }
  }

  unsubscribe(component) {
    // propagate recursively
  }

  _subscribeContexts(name, component) {
    // get or create
    let components = this.getComponents(name);
    if (!components) {
      this.subscriptions.set(name, components = []);
    }

    // add component
    components.push(component);
  }

  _unsubscribeContexts(name, component) {
    const components = this.getComponents(name);
    if (!components) {
      this.logger.error(`Tried to unsubscribe component "${component}" that has not been subscribed to context "${name}"`);
      return;
    }
    pull(components, component);
  }

  // ###########################################################################
  // setContext
  // ###########################################################################

  async setContext(name, update) {
    const context = this.getContext(name);
    Object.assign(context, update);
    return this._updateContext();
  }

  async _updateContext(name) {
    const components = this.getComponents(name);
    if (!components) {
      return undefined;
    }

    const value = this.contexts[name];

    return Promise.all(components.map(async comp => {
      const handler = comp.onContexts[name];
      if (!handler) {
        return;
      }

      // call specific handler
      handler(name, value);

      // call `update`
      await comp.forceUpdate();
    }));
  }
}