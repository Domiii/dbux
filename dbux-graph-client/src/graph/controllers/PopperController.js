import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

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
      this.owner.dom.addElementEventListeners(this, target, this.targetEvents);
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
