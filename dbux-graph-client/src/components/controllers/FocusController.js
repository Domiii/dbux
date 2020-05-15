import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

/**
 * Padding (in pixels) to leave 
 */
const pad = 10;



function computeDelta1D(p, s, bp, bs) {
  let dLeft = bp - p - pad;
  if (dLeft > 0) {
    // too far left
    return dLeft;
  }
  else {
    // too far right
    const dRight = (bp + bs) - (p + s) - pad;   // distance to right edge
    return Math.max(dLeft, dRight); // NOTE: both numbers are negative; we want the one, closer to 0
  }
}

window.computeDelta = function computeDelta(node) {
  const 
};

export default class FocusController extends ClientComponentEndpoint {
  init() {
    this.panzoom = this.owner.panzoom;

    // [debug-global] for debugging purposes
    window.panzoom = this.panzoom;

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
      this.logger.error("context node of selected trace not found");
      return;
    }

    let nodeBounds = node.getBoundingClientRect();
    if (!nodeBounds.height) {
      this.logger.error('Trying to slide to unrevealed node');
    }

    // let toolbar = document.querySelector("#toolbar");
    // let barPos = toolbar.getBoundingClientRect();

    this.slideData = {
      startTime: Date.now(),
      startX: this.panzoom.getTransform().x,
      startY: this.panzoom.getTransform().y,
      distanceX: barPos.left - nodeBounds.x,
      distanceY: barPos.bottom + 10 - nodeBounds.y,
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