import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '../util/domUtil';

class RunNode extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="run-node flex-row">
        <!--div>
          <button data-el="nodeToggleBtn" class="nodeToggleBtn">▽</button>
        </div-->
        <div class="flex-column">
          <!--div style="display:flex; flex-direction:row;">
            <h6 data-el="title"></h6>
          </div-->
          <div data-el="nodeChildren" data-mount="ContextNode" class="node-children"></div>
        </div>
      </div>
    `);

    return el;
  }
  
  update() {
    const { applicationId, runId } = this.state;
    // this.els.title.textContent = `Run #${runId} (Application #${applicationId})`;
  }
}

export default RunNode;