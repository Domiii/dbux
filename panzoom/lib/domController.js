module.exports = makeDomController

module.exports.canAttach = isDomElement;

function makeDomController(domElement, options) {
  var elementValid = isDomElement(domElement); 
  if (!elementValid) {
    throw new Error('panzoom requires DOM element to be attached to the DOM tree')
  }

  var owner = domElement.parentElement;
  // domElement.scrollTop = 0;
  
  if (!options.disableKeyboardInteraction) {
    owner.setAttribute('tabindex', 0);
  }

  var api = {
    getBBox: getBBox,
    getOwner: getOwner,
    applyTransform: applyTransform,
  }
  
  return api

  function getOwner() {
    return owner
  }

  function getBBox() {
    // TODO: We should probably cache this?
    return  {
      left: 0,
      top: 0,
      width: domElement.clientWidth,
      height: domElement.clientHeight
    }
  }

  function applyTransform(transform) {
    // TODO: Should we cache this?
    // domElement.style.transformOrigin = '0 0 0';
    // domElement.style.transform = 'matrix(' +
    //   transform.scale + ', 0, 0, ' +
    //   transform.scale + ', ' +
    //   transform.x + ', ' + transform.y + ')';
    
    // domElement.querySelector('.body').style.transform = 'matrix(' +
    // transform.scale + ', 0, 0, ' +
    // transform.scale + ', ' +
    // 0 + ', ' + 0 + ')';
    
    // just use scale, so use scale to replcae matrix -del
    domElement.querySelector('.body').style.transform = `scale(${transform.scale})`;
    domElement.scrollLeft = transform.x;
    domElement.scrollTop = transform.y;
    // console.trace('scroll', domElement.querySelector('.body').style.transform, transform.x, transform.y);
    
    // [scroll fix]
    // console.log("tx",transform.x,"ty",transform.y,"scrollTop",domElement.scrollTop,"scollLeft",domElement.scrollLeft);
  }
}

function isDomElement(element) {
  return element && element.parentElement && element.style;
}
