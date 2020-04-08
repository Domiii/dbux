import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../util/domUtil';

class RunNode extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="red">
        <h6 data-el="title"></h6>
        <div data-mount="ContextNode"></div>
      </div>
    `);

    return el;
  }

  update() {
    const { applicationId, runId } = this.state;
    
    this.els.title.textContent = `Run #${runId} (Application #${applicationId})`;
  }
}

export default RunNode;