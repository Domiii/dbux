import { compileHtmlElement } from '../../util/domUtil';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

/** @typedef {import('../controllers/PopperManager').default} PopperManager */

class AsyncStack extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div>
        <div data-mount="GraphRoot"></div>
      </div
    `);
  }
}
export default AsyncStack;