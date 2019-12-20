import fsPath from 'path';
import buildProgramVisitorState from './programVisitorState';
import { addDbuxInitDeclaration, wrapProgram } from './instrumentation/program';


// ########################################
// enter
// ########################################

function getFilePath(state) {
  let filename = state.filename && fsPath.normalize(state.filename) || 'unknown_file.js';
  const cwd = fsPath.normalize(state.cwd);
  if (filename.startsWith(cwd)) {
    filename = fsPath.relative(state.cwd, filename);
  }
  return filename;
}

function enter(path, state) {
  if (state.onEnter) return; // make sure to not visit Program node more than once

  const filePath = getFilePath(state);
  const fileName = fsPath.basename(filePath);

  const { scope } = path;

  const staticId = 1;
  const programStaticContext = {
    staticId,
    type: 1,
    name: "Program"
  };
  path.setData('staticId', staticId);

  // inject program-wide state
  Object.assign(state,

    // some non-parameterized state
    buildProgramVisitorState(),

    // program-dependent state
    {
      ids: {
        dbuxInit: scope.generateUid('dbux_init'),
        dbuxRuntime: scope.generateUid('dbuxRuntime'),
        dbux: scope.generateUid('dbux')
      },
      // console.log('[Program]', state.filename);

      // static program data
      filePath,
      fileName,
      staticSites: [
        null,
        programStaticContext
      ]
    }
  );

  // instrument Program itself
  wrapProgram(path, state);
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