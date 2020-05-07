import isFunction from 'lodash/isFunction';
import { collectElementsByDataAttrMulti } from '../util/domUtil';

/**
 * Helps DOM elements "components" more easily manage it's DOM.
 * Exposes `els`, `mountPoints`.
 * Expects owner to have `dom`, `el`, `parent` (optional), `on` (optional).
 */
export default class DOMWrapper {
  constructor(owner) {
    this.owner = owner;
    this.logger = owner.logger;
  }

  get el() {
    if (this.owner instanceof HTMLElement) {
      return this.owner;
    }
    return this.owner.el;
  }

  process() {
    const { owner } = this;
    const {
      el,
      parent,
      on
    } = this.owner;

    this.els = collectElementsByDataAttrMulti(el, 'el');
    this.mountPointsByComponentName = collectElementsByDataAttrMulti(el, 'mount');

    // hook up event listeners
    if (on) {
      this.addEventListeners(this);
    }

    if (parent && parent.dom && parent.el) {
      // append element to parent, if it has one
      parent.dom.appendChild(owner);
    }
  }

  addEventListeners(owner) {
    const { on } = owner;

    for (const elName in on) {
      const compConfig = on[elName];
      const child = this.els[elName];
      if (!child) {
        this.logger.error(`Invalid event handler (on) - el name does not exist: "${elName}". Are you missing a "data-el" attribute?`);
        continue;
      }
      for (const eventName in compConfig) {
        const cb = compConfig[eventName];
        if (!isFunction(cb)) {
          this.logger.error(`Invalid event handler (on) - is not a function: "${elName}.${eventName}"`);
          continue;
        }
        child.addEventListener(eventName, cb.bind(owner));
      }
    }
  }

  appendChild(child) {
    const mountName = child.componentName;
    const mountPointEl = this.mountPointsByComponentName?.[mountName];
    if (!mountPointEl) {
      this.logger.error(`Could not add child to parent. Parent ${this.owner} did not have a mount type for child ${mountName}`);
      return;
    }

    mountPointEl.appendChild(child.el);
  }

  /**
   * hackfix: the VSCode webview does not re-render correctly when `panzoom` library updates element `transform`.
   *    This forces it to re-render.
   */
  repaint = () => {
    // var el = document.querySelector('#root');
    // var el = domElement;
    const { el } = this;
    const p = el.parentNode;
    p.removeChild(el);
    p.appendChild(el);
  }

  remove() {
    const { el } = this;
    if (el?.parentNode) {
      // remove element from DOM
      el.parentNode.removeChild(el);
      this.owner.el = null;
    }
  }
}