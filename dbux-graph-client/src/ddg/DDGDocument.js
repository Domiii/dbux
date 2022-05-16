import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class DDGDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-el="DDGDataView"></div>
      <div data-mount="DDGTimelineView"></div>
    </div>`;
    return el;
  }
}
