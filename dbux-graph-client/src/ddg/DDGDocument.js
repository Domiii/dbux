import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class DDGDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-el="timeline" data-mount="DDGTimelineView"></div>
    </div>`;
    return el;
  }

  get timeline() {
    return this.children.getComponent('DDGTimelineView');
    // return this.els.timeline;
  }
}
