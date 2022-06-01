import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

/**
 * Hackfix: monkey patch fetch, to get the resources we need.
 * future-work: move to more central place
 */
function fixFetch(fixUrl) {
  const _fetch = fetch;
  window.fetch = async function _monkeyFetch(target, ...args) {
    target = await fixUrl(target);
    // console.log(`fetch`, target);
    return _fetch.call(this, target, ...args);
  };
}


export default class DDGDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-el="timeline" data-mount="DDGTimelineView"></div>
    </div>`;
    return el;
  }

  setupEl() {
    fixFetch(async (target) => {
      // if (target.endsWith('graphvizlib.wasm')) {
      if (target.startsWith('.')) {
        // hackfix
        return this.getClientResourceUri('dist/web', target);
      }
      // }
      return target;
    });
  }

  get timeline() {
    return this.children.getComponent('DDGTimelineView');
  }

  get toolbar() {
    return this.children.getComponent('Toolbar');
  }
}
