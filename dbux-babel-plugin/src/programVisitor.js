import fsPath from 'path';
import buildProgramVisitorState from './programVisitorState';
import { addDbuxInitCall, addDbuxInitDeclaration, wrapProgramBody } from './instrumentation/program';


// ########################################
// enter
// ########################################

function getFilename(state) {
  let filename = fsPath.normalize(state.filename);
  const cwd = fsPath.normalize(state.cwd);
  if (filename.startsWith(cwd)) {
    filename = fsPath.relative(state.cwd, filename);
  }
  return filename;
}

function enter(path, state) {
  if (state.onEnter) return; // make sure to not visit Program node more than once

  const filename = getFilename(state);

  const { scope } = path;

  const staticId = 1;
  path.setData('staticId', staticId);

  // inject program-wide state
  Object.assign(state,
    
    // some non-parameterized state
    buildProgramVisitorState(),
    
    // program-dependent state
    {
      lastStaticId: staticId,
      ids: {
        dbuxInit: scope.generateUid('dbux_init'),
        dbuxRuntime: scope.generateUid('dbuxRuntime'),
        dbux: scope.generateUid('dbux')
      },
      // console.log('[Program]', state.filename);

      // static program data
      filename,
      staticSites: [{
        staticId,
        type: 1,
        name: filename
      }]
    }
  );

  // instrument Program itself
  wrapProgramBody(path, state);
}


// ########################################
// exit
// ########################################

function exit(path, state) {
  if (!state.onExit(path)) return;

  addDbuxInitDeclaration(path, state);
}


// ########################################
// programVisitor
// ########################################

export default function programVisitor() {
  return {
    enter,
    exit
  };
}