import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');

    // complete reset
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-mount="GraphRoot"></div>
    </div>`;
    
    return el;
  }
}

export default GraphDocument;