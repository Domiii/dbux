import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../util/domUtil';

class RunNode extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="red">
        <h3 data-el="title"></h3>
        <div data-mount="ContextNode"></div>
      </div>
    `);

    return el;
  }

  update() {
    const { runId } = this.state;
    
    this.els.title.textContent = `Run #${runId}`;
  }
}

export default RunNode;