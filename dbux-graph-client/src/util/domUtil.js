/**
 * Generic render utilities.
 * Not to be confused with the `renderUtil/` folder which contains *specific* render utilities for specific parts (business logic) of the app.
 */

export const DefaultSlideDelay = 200;


// ##################################################################################################################
// Conditional CSS classes
// ##################################################################################################################

export function decorateClasses($el, cfg) {
  for (let clazz in cfg) {
    let val = cfg[clazz];

    if (val) {
      $el.addClass(clazz);
    }
    else {
      $el.removeClass(clazz);
    }
  }
}

// ##################################################################################################################
// More rendering (HTML, CSS + color) utilities
// ##################################################################################################################


/**
 * A linear interpolator for hexadecimal colors
 * @param {String} a
 * @param {String} b
 * @param {Number} amount
 * @example
 * // returns #7F7F7F
 * lerpColor('#000000', '#ffffff', 0.5)
 * @returns {String}
 * @see https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
 */
export function lerpColor(a, b, amount) {
  const ah = parseInt(a.replace(/#/g, ''), 16),
    ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ''), 16),
    br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
    rr = ar + amount * (br - ar),
    rg = ag + amount * (bg - ag),
    rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

// more stuff

// select text on click
// see: https://stackoverflow.com/a/20079910
export function selectTextOnClick(el) {
  // select text on Click
  window.getSelection().selectAllChildren(el);

  // old version
  // see: https://stackoverflow.com/questions/4067469/selecting-all-text-in-html-text-input-when-clicked
  // $inputEl[0].onclick = function () { this.setSelectionRange(0, this.value.length) };
}


// ###########################################################################
// Forms
// ###########################################################################

export function formOnEnter($form, cb) {
  $form.on('keydown', evt => {
    // console.log($(evt.target).closest('form')[0]);
    if (evt.keyCode === 13 && $(evt.target).closest('form')[0] === $form[0]) {
      cb(evt);
    }
  });
}


// ###########################################################################
// events
// ###########################################################################

export async function waitForClick($btn) {
  return new Promise(r => $btn.off('click').on('click', r));
}

export async function addInputTypeEvent($input, cb) {
  $input.on('keyup', evt => {
    if (evt.keyCode && !evt.keyCode.toString().match(/^(37|38|39|40|13|16|17|18|224)$/)) {
      cb(evt);
    }
  });
}

// ###########################################################################
// CSS utils
// ###########################################################################

/**
 * 
 * 
 * @see https://stackoverflow.com/a/34490573
 */
export function setElementStyle(styles, element) {
  Object.assign(element.style, styles);
}