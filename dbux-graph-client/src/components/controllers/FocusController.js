import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

export default class FocusController extends ClientComponentEndpoint {
  init() {
    this.panzoom = this.owner.panzoom;
    this.focus = {};
    this.slideData = {
      slideSpeed: 1
    };
  }

  update() {
    const { focus } = this.state;
    if (focus) {
      this.focus = focus;
      this.slide(focus.applicationId, focus.contextId);
    }
    this.logger.debug('focuscontroller updated');
  }

  //focus slide. referance https://codepen.io/relign/pen/qqZxqW?editors=0011
  //need chossing application 
  slide = (applicationId, contextId, slideSpeed = 0.3) => {
    contextId = `#application_${applicationId}-context_${contextId}`;
    let node = document.querySelector(contextId);
    if (!node) {
      this.app.confirm("trace is not found!");
      return;
    }
    let nodePos = node.getBoundingClientRect();
    if (nodePos.x === 0) {
      this.logger.error('Trying to slide to unrevealed node');
    }
    let toolbar = document.querySelector("#toolbar");
    let barPos = toolbar.getBoundingClientRect();

    this.slideData = {
      startTime: Date.now(),
      startX: this.panzoom.getTransform().x,
      startY: this.panzoom.getTransform().y,
      distanceX: barPos.left - nodePos.x,
      distanceY: barPos.bottom + 10 - nodePos.y,
      slideSpeed
    };

    requestAnimationFrame(() => this.step(node));

    // node.classList.add("flash-me");
    // setTimeout(() => { node.classList.remove("flash-me"); }, (slideSpeed + 3) * 1000);
  }

  step = (node) => {
    if (!this.focus) {
      return;
    }

    const {
      startTime,
      startX,
      startY,
      distanceX,
      distanceY,
      slideSpeed
    } = this.slideData;

    let progress = Math.min(1.0, (Date.now() - startTime) / (slideSpeed * 1000));

    this.panzoom.moveTo(startX + distanceX * progress, startY + distanceY * progress);
    this.owner._repaint();
    if (progress < 1.0) {
      requestAnimationFrame(() => this.step(node));
    }
    else {
      this.remote.notifyFocused();
    }
  }
}