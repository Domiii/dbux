import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class PopperController extends ClientComponentEndpoint {
  /**
   * Owner requirement:
   *  el `popperTarget`: with attribute [popperString]
   *  context `popperManager`
   */
  init() {
    this.target = this.owner.els.popperTarget;
    this.popperString = this.target.getAttribute('popper-string');
    this.manager = this.owner.context.graphRoot.popperManager;

    // on click -> nextMode
    this.owner.dom.addEventListeners(this.on);
  }

  on = {
    popperTarget: {
      mouseenter: () => {
        this.manager.show(this.target, this.popperString);
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
}
