import { getBindingPath } from './bindingsHelper';
import { getPresentableString } from './pathHelpers';


// ###########################################################################
// makeInputSimple
// ###########################################################################

const inputMakers = {
  Identifier(path) {
    const bindingPath = getBindingPath(path);
    
    // TODO: get traceId of `bindingPath`
    
    // TODO: make input for identifier
    return {};
  }
};

// TODO: move this to the right place
/**
 * Generate input data from path that does not have a `ParseNode` (primarily `Identifier`)
 * 
 * @param {*} path 
 * @returns 
 */
export function makeInputSimple(path) {
  const maker = inputMakers[path.node.type];
  if (!maker) {
    this.logger.warn(`Unknown input node: ${getPresentableString(path)}`);
    return null;
  }

  return maker(path);
}


// ###########################################################################
// makeOutputSimple
// ###########################################################################

const outputMakers = {
  Identifier(path) {
    // TODO: make output for identifier

    return {};
  }
};

// TODO: move this to the right place
/**
 * Generate input data from path that does not have a `ParseNode` (primarily `Identifier`)
 * 
 * @param {*} path 
 * @returns 
 */
export function makeOutputSimple(path) {
  const maker = outputMakers[path.node.type];
  if (!maker) {
    this.logger.warn(`Unknown output node: ${getPresentableString(path)}`);
    return null;
  }

  return maker(path);
}