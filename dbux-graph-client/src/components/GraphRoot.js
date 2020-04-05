import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '@/util/domUtil';

class GraphRoot extends ClientComponentEndpoint {
  createEl() {
    const el = compileHtmlElement(/*html*/`
      <div class="red">
        <h2 data-el="title"></h2>
        <div data-mount="RunNode"></div>
      </div>
    `);

    return el;
  }

  update() {
    const { applications } = this.state;

    if (applications) {
      this.els.title.textContent = `${applications.map(app => app.name).join(', ')}`;
    }
    else {
      this.els.title.textContent = '(no applications selected)';
    }
  }
}

export default GraphRoot;