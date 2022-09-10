
/**
 * Take screenshot of call graph.
 * 
 * 
 */
async function screen() {
  try {
    await takeScreenshot('.graph-container:not(.hidden) .graph-body');
  }
  catch (err) {
    console.error(`SCREENSHOT FAILED:`, err);
  }
}

/** ###########################################################################
 * copy button
 *  #########################################################################*/

// eslint-disable-next-line vars-on-top, no-var
var screenBlob, screenBtn;

function insertScreenBtn() {
  cleanUp();

  screenBtn = document.createElement('button');
  screenBtn.addEventListener('click', copyScreen);
  screenBtn.textContent = 'COPY SCREENSHOT';
  document.body.prepend(screenBtn);
}

function cleanUp() {
  if (!screenBtn) {
    return;
  }

  document.body.removeChild(screenBtn);

  screenBtn = null;
}

async function copyScreen() {
  if (screenBlob) {
    await navigator.clipboard
      .write([
        // eslint-disable-next-line no-undef
        new ClipboardItem(
          Object.defineProperty({}, screenBlob.type, {
            value: screenBlob,
            enumerable: true
          })
        )
      ]);
    console.log('Done! Screenshot has been copied.');
  }
  else {
    // bug
    console.error('Could not copy screenshot. It did not exist :(');
  }

  cleanUp();
}

/** ###########################################################################
 * {@link takeScreenshot}
 *  #########################################################################*/

/**
 * @see https://stackoverflow.com/questions/40278230/how-to-copy-canvas-as-image-to-clipboard-using-javascript-programmatically
 */
async function takeScreenshot(selector) {
  let targetEl = document.querySelector(selector);
  if (!targetEl) {
    throw new Error(`tragetEl not found for "${selector}"`);
  }
  await getOrLoadLibraries();

  // eslint-disable-next-line no-undef
  const canvas = await html2canvas(targetEl);
  // NOTE: most add canvas to DOM; else you cannot use it properly.
  document.body.appendChild(canvas);

  try {
    insertScreenBtn();
    screenBlob = await new Promise(r => canvas.toBlob(r));

    console.log('Screenshot ready! Press button to copy.');
  }
  catch (err) {
    cleanUp();
    throw err;
  }
  finally {
    document.body.removeChild(canvas);
  }
}


/** ###########################################################################
 * {@link getOrLoadScript}
 *  #########################################################################*/

async function getOrLoadLibraries() {
  // NOTE: we cannot load libraries dynamically due to CSP problems. It is now built into the client library
  // // https://cdnjs.com/libraries/html2canvas
  // return getOrLoadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
}

async function getOrLoadScript(url) {
  const res = await fetch(url);
  const js = await res.text();

  return eval(js);
}

// /**
//  * NOTE: must have CSP exception to work.
//  * @see https://stackoverflow.com/a/49780469
//  */
// async function getOrLoadScript(url, beforeEl = null, async = true, defer = true) {
//   const existingEl = document.querySelector(`[src="${url}"]`);
//   if (existingEl) {
//     return;
//   }
//   // eslint-disable-next-line consistent-return
//   return new Promise((resolve, reject) => {
//     let script = document.createElement('script');
//     const prior = beforeEl || document.getElementsByTagName('script')[0];

//     script.async = async;
//     script.defer = defer;

//     function onloadHander(_, isAbort) {
//       if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
//         script.onload = null;
//         script.onreadystatechange = null;
//         script = undefined;

//         setTimeout(() => {
//           // wait for a tick, to make sure, all operations have completed.
//           if (isAbort) { reject(); } else { resolve(); }
//         });
//       }
//     }

//     script.onload = onloadHander;
//     script.onreadystatechange = onloadHander;

//     script.src = url;
//     prior.parentNode.insertBefore(script, prior);
//   });
// }

screen();