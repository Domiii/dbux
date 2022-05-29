import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';
import { addElementEventListeners } from '../../util/domUtil';

export default class PopperController extends ClientComponentEndpoint {
  get manager() {
    return this.context.graphDocument.popperManager;
  }

  /**
   * Owner requirements:
   *  DOM elements with attribute [data-tooltip]
   */
  init() {
    const targets = this.owner.el.querySelectorAll('[data-tooltip]');
    targets.forEach(target => {
      addElementEventListeners(target, this.targetEvents, this);
    });
  }

  targetEvents = {
    mouseenter(evt) {
      this.manager.show(evt.target, evt.target.getAttribute('data-tooltip'));
    },
    mouseleave: () => {
      this.manager.hide();
    }
  }
}
