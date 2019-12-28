import { buildProgram } from './builders';


export function replaceProgramBody(programPath, newBody) {
  const newProgramNode = buildProgram(programPath, newBody);
  programPath.replaceWith(newProgramNode);
}