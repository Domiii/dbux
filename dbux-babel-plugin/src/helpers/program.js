import { buildProgram } from '../instrumentation/builders/common';


export function replaceProgramBody(programPath, newBody) {
  const newProgramNode = buildProgram(programPath, newBody);
  programPath.replaceWith(newProgramNode);
}