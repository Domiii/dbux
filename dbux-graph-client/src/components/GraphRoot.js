import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '@/util/domUtil';

class GraphRoot extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="root">
        <h2 data-el="title"></h2>
        <div data-mount="RunNode"></div>
      </div>
    `);
  }

  update() {
    const { applications } = this.state;

    if (applications?.length) {
      this.els.title.textContent = `${applications.map(app => app.name).join(', ')}`;
    }
    else {
      this.els.title.textContent = '(no applications selected)';
    }
  }
}

export default GraphRoot;