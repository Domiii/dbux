import template from '@babel/template';

// ###########################################################################
// builders
// ###########################################################################

const x = template(`
`);

// ###########################################################################
// visitor
// ###########################################################################

function enter(path, state) {
  if (!state.onEnter(path, 'context')) return;

  // not doing anything for now
}


export function statementVisitor() {
  return {
    enter
  };
} 