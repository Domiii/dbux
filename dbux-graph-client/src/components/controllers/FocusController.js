import ClientComponentEndpoint from '@/componentLib/ClientComponentEndpoint';

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

/**
 * Computes amount of pixels by which a node is outisde the viewport.
 */

// [scroll fix]
function computeDelta(node) {
  const nodeBounds = node.getBoundingClientRect();

  // start underneath the toolbar
  let toolbar = document.querySelector("#toolbar");
  let barY = toolbar.getBoundingClientRect().bottom;

  return {
    x: computeDelta1D(nodeBounds.x, nodeBounds.width, 0, window.innerWidth - scrollPadding),
    y: computeDelta1D(nodeBounds.y, nodeBounds.height, barY, window.innerHeight - barY - scrollPadding)
  };
}
window.computeDelta = computeDelta;

// ###########################################################################
// FocusController
// ###########################################################################

export default class FocusController extends ClientComponentEndpoint {
  init() {
    this.panzoom = this.owner.panzoom;

    // [debug-global] for debugging purposes
    window.panzoom = this.panzoom;

    this.focus = {};
    this.slideData = {
      animTime: 1
    };
  }

  update() {
    const { focus } = this.state;
    if (focus) {
      this.focus = focus;
      this.slide(focus.applicationId, focus.contextId);
    }
  }

  //focus slide. referance https://codepen.io/relign/pen/qqZxqW?editors=0011
  //need chossing application 
  slide = (applicationId, contextId, animTime = 0.1) => {
    const nodeId = `#application_${applicationId}-context_${contextId}`;
    let node = document.querySelector(nodeId);
    if (!node) {
      this.logger.error("context node of selected trace not found");
      return;
    }

    let nodeBounds = node.getBoundingClientRect();
    if (!nodeBounds.height && !nodeBounds.width) {
      this.logger.error('Trying to slide to unrevealed node', nodeId, JSON.stringify(nodeBounds));
      return;
    }

    // [scroll fix]
    const delta = computeDelta(node);
    // console.log('\n');
    // console.log('scroll position:', 'Top:', this.panzoom.getTransform().y, 'Left:', this.panzoom.getTransform().x);
    // console.log('delta:', 'x', delta.x, 'y:', delta.y);

    if (!(Math.abs(delta.x) + Math.abs(delta.y))) {
      // nothing to do here
      return;
    }
    
    this.logger.debug(`Moving node ${nodeId} by ${delta.x}, ${delta.y}`);

    this.slideData = {
      startTime: Date.now(),
      startX: this.panzoom.getTransform().x,
      startY: this.panzoom.getTransform().y,
      delta,
      animTime
    };

    requestAnimationFrame(() => this.step(node));

    // node.classList.add("flash-me");
    // setTimeout(() => { node.classList.remove("flash-me"); }, (animTime + 3) * 1000);
  }

  step = (node) => {
    if (!this.focus) {
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
    } = this.slideData;

    let progress = Math.min(1.0, (Date.now() - startTime) / (animTime * 1000));

    // [scroll fix]
    this.panzoom.moveTo(startX - x * progress, startY - y * progress);
    // this.owner._repaint();
    if (progress < 1.0) {
      requestAnimationFrame(() => this.step(node));
    }
    else {
      this.remote.notifyFocused();
    }
  }
}