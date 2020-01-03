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
  if (!state.onEnter(path)) return;

  // not doing anything for now
}


export function statementVisitor() {
  return {
    enter
  };
} 