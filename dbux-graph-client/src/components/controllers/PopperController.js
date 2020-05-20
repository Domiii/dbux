import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class PopperController extends ClientComponentEndpoint {

  get manager() {
    return this.owner.context.graphRoot.popperManager;
  }

  /**
   * Owner requirement:
   *  el `popperTarget`
   *  property/getter: `popperString`
   *  context `popperManager`
   */
  init() {
    // on click -> nextMode
    // this.owner.dom.addEventListeners(this);

    const targets = this.owner.el.querySelectorAll('[data-tooltip]');
    targets.forEach(target => {
      this.owner.dom.addElementEventListeners(this, target, this.targetEvents);
    });
  }

  targetEvents = {
    mouseenter(evt) {
      this.manager.show(evt.target, evt.target.getAttribute('data-tooltip'));
    },
    focus: () => {
      this.manager.show(this.target, this.popperString);
    },
    mouseleave: () => {
      this.manager.hide();
    },
    blur: () => {
      this.manager.hide();
    }
  }
}
