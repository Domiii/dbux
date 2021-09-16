import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

// ###########################################################################
// animation computations
// ###########################################################################

/**
 * Padding (in pixels) between the edge of the viewport and node target position
 */
const focusPadding = 30;

/**
 * Padding (in pixels) added by scrollbars at the bottom and the right
 */
const scrollPadding = 10;

/**
 * @param {*} p position
 * @param {*} s size
 * @param {*} wp window position
 * @param {*} ws window size
 */
function computeDelta1D(p, s, wp, ws) {
  wp += focusPadding;
  ws -= focusPadding;

  let dLeft = wp - p;
  if (dLeft > 0) {
    // too far left
    return dLeft;
  }

  // too far right
  const dRight = (wp + ws) - (p + s);   // distance to right edge
  if (dRight < 0) {
    return Math.max(dLeft, dRight); // NOTE: both numbers are negative, and we want the one closer to 0
  }

  // we are already in the right spot
  return 0;
}

// ###########################################################################
// FocusController
// ###########################################################################

export default class FocusController extends ClientComponentEndpoint {
  /**
   * Owner requirements:
   *  els `panzoomCanvas`
   *  property `panzoom`
   */
  get panzoom() {
    return this.context.graphContainer.panzoom;
  }

  get canvas() {
    return this.context.graphContainer.els.panzoomCanvas;
  }

  init() {
    this.targetDOM = null;
  }

  isSliding() {
    return !!this.targetDOM;
  }

  /**
   * @param {ClientComponentEndpoint} node
   */
  slideToNode = (node) => {
    // Note: Slide to given node. referance https://codepen.io/relign/pen/qqZxqW?editors=0011
    if (!node) {
      this.stopSlide();
      return;
    }

    if (!node.el) {
      this.logger.error(`Trying to focus on node without DOM element: ${JSON.stringify(node)}`);
      return;
    }

    this.slide(node.el);
  }

  slide = (target) => {
    if (!target) {
      this.stopSlide();
      return;
    }

    const targetDOM = this.targetDOM = target;

    const nodeBounds = target.getBoundingClientRect();
    if (!nodeBounds.height && !nodeBounds.width) {
      this.logger.error(`Trying to slide to unrevealed DOM: ${targetDOM.outerHTML}, ${JSON.stringify(nodeBounds)}`);
      return;
    }

    const delta = this.computeDelta(target);

    if (!(Math.abs(delta.x) + Math.abs(delta.y))) {
      // nothing to do here
      return;
    }

    const slideData = {
      startTime: performance.now(),
      startX: this.panzoom.getTransform().x,
      startY: this.panzoom.getTransform().y,
      delta,
      animTime: 0.1
    };

    requestAnimationFrame(() => this._step(target, slideData));
  }

  stopSlide() {
    this.targetDOM = null;
  }

  _step = (targetDOM, slideData) => {
    if (targetDOM !== this.targetDOM) {
      // target changed, stop animation
      return;
    }
    const {
      startTime,
      startX,
      startY,
      delta: {
        x,
        y
      },
      animTime
    } = slideData;

    const progress = Math.min(1.0, (performance.now() - startTime) / (animTime * 1000));

    // [scroll fix]
    this.panzoom.moveTo(startX - x * progress, startY - y * progress);
    if (progress < 1.0) {
      requestAnimationFrame(() => this._step(targetDOM, slideData));
    }
    else {
      this.targetDOM = null;
    }
  }

  /** ###########################################################################
   * slide distance calculation
   *  #########################################################################*/

  /**
   * Computes amount of pixels by which a node is outisde the viewport.
   */
  computeDelta(node) {
    const nodeBounds = node.getBoundingClientRect();
    const canvasBounds = this.canvas.getBoundingClientRect();

    return {
      x: computeDelta1D(nodeBounds.x, nodeBounds.width, canvasBounds.x, canvasBounds.width - scrollPadding),
      y: computeDelta1D(nodeBounds.y, nodeBounds.height, canvasBounds.y, canvasBounds.height - scrollPadding)
    };
  }

  public = {
    slideToNode: this.slideToNode,
  }
}